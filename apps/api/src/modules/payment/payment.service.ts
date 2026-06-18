import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountType, Order, OrderItem, OrderStatus, Prisma } from 'prisma/generated/prisma';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import Stripe from 'stripe';
import { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto';

type OrderWithItems = Order & { orderItems: OrderItem[] };

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      throw new InternalServerErrorException('Stripe is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-02-25.clover',
    });
  }

  private handleStripeError(error: unknown, context = 'Stripe Operation') {
    if (error instanceof Stripe.errors.StripeError) {
      this.logger.error(`[${context}] Stripe error: ${error.message}`, error.stack);
    } else if (error instanceof Error) {
      this.logger.error(`[${context}] Unexpected error: ${error.message}`, error.stack);
    } else {
      this.logger.error(`[${context}] Unknown error`);
    }
    throw error;
  }

  async createPaymentIntent(paymentDto: CreatePaymentDto, account: JWTdecode) {
    const order = await this.prismaService.order.findFirst({
      where: {
        id: paymentDto.orderId,
        userId: account.accountId,
        status: OrderStatus.PENDING,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or access denied');
    }

    if (order.paymentIntentId) {
      const existingIntent = await this.stripe.paymentIntents.retrieve(
        order.paymentIntentId,
      );

      return {
        success: true,
        clientSecret: existingIntent.client_secret,
        paymentIntentId: existingIntent.id,
        status: existingIntent.status,
      };
    }

    try {
      const currency =
        paymentDto.currency ||
        this.configService.get<string>('stripe.currency') ||
        'usd';
      const amount = Math.round(Number(order.totalPrice) * 100);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new BadRequestException('Order total is invalid');
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        description: paymentDto.description,
        metadata: {
          source: 'ecommerce-api',
        },
      });

      await this.prismaService.order.update({
        where: { id: order.id },
        data: {
          paymentIntentId: paymentIntent.id,
          paymentInfo: this.buildPaymentInfo(order.paymentInfo, {
            provider: 'stripe',
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            amount,
            currency,
          }),
          updatedAt: BigInt(Date.now()),
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: unknown) {
      this.handleStripeError(error, 'createPaymentIntent');
    }
  }

  async getPaymentIntent(paymentIntentId: string, account: JWTdecode) {
    const order = await this.findOrderForPaymentIntent(paymentIntentId, account);
    if (!order) {
      throw new NotFoundException('Payment not found or access denied');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return this.toPaymentIntentResponse(paymentIntent);
    } catch (error: unknown) {
      this.handleStripeError(error, 'getPaymentIntent');
    }
  }

  async refundPayment(refundDto: RefundPaymentDto, account: JWTdecode) {
    const order = await this.findOrderForPaymentIntent(
      refundDto.paymentIntentId,
      account,
    );

    if (!order) {
      throw new NotFoundException('Payment not found or access denied');
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed orders can be refunded');
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: refundDto.paymentIntentId,
        amount: refundDto.amount ? Math.round(refundDto.amount * 100) : undefined,
        reason: refundDto.reason as Stripe.RefundCreateParams.Reason,
      });

      // The current schema has no refunded/partially-refunded order state.
      // Keep the order state unchanged and record provider refund details only.
      await this.prismaService.order.update({
        where: { id: order.id },
        data: {
          paymentInfo: this.buildPaymentInfo(order.paymentInfo, {
            provider: 'stripe',
            paymentIntentId: refundDto.paymentIntentId,
            refundId: refund.id,
            refundStatus: refund.status,
          }),
          updatedAt: BigInt(Date.now()),
        },
      });

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
      };
    } catch (error: unknown) {
      this.handleStripeError(error, 'refundPayment');
    }
  }

  async createCustomer(account: JWTdecode) {
    const foundAccount = await this.prismaService.account.findFirst({
      where: {
        id: account.accountId,
        accountType: AccountType.USER,
      },
      include: {
        authentication: true,
        profile: true,
      },
    });

    if (!foundAccount?.authentication?.email) {
      throw new NotFoundException('Account not found');
    }

    try {
      const customer = await this.stripe.customers.create({
        email: foundAccount.authentication.email,
        name: foundAccount.profile?.name,
        metadata: {
          source: 'ecommerce-api',
        },
      });

      return {
        success: true,
        customerId: customer.id,
      };
    } catch (error: unknown) {
      this.handleStripeError(error, 'createCustomer');
    }
  }

  async handleWebhookEvent(signature: string, payload: Buffer | string) {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    if (!webhookSecret) {
      throw new InternalServerErrorException('Stripe webhook is not configured');
    }

    if (!signature || !(Buffer.isBuffer(payload) || typeof payload === 'string')) {
      throw new BadRequestException('Invalid webhook payload');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error: unknown) {
      this.logger.warn('Stripe webhook signature verification failed');
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(
          event.id,
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await this.handlePaymentFailed(
          event.id,
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(
    eventId: string,
    paymentIntent: Stripe.PaymentIntent,
  ) {
    await this.prismaService.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          paymentIntentId: paymentIntent.id,
        },
        include: {
          orderItems: true,
        },
      });

      if (!order) {
        this.logger.warn(`Payment intent has no local order: ${paymentIntent.id}`);
        return;
      }

      if (order.status === OrderStatus.CONFIRMED) {
        return;
      }

      if (order.status !== OrderStatus.PENDING) {
        this.logger.warn(
          `Ignoring success webhook for order in ${order.status} state`,
        );
        return;
      }

      const expectedAmount = Math.round(Number(order.totalPrice) * 100);
      const receivedAmount = paymentIntent.amount_received || paymentIntent.amount;
      if (receivedAmount !== expectedAmount) {
        throw new BadRequestException('Payment amount does not match order total');
      }

      await tx.reservationInventory.updateMany({
        where: {
          userId: order.userId,
          inventoryId: {
            in: order.orderItems.map((item) => item.inventoryId),
          },
          valid: true,
          isConfirmed: false,
        },
        data: {
          isConfirmed: true,
          valid: false,
          updatedAt: BigInt(Date.now()),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CONFIRMED,
          paymentInfo: this.buildPaymentInfo(order.paymentInfo, {
            provider: 'stripe',
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            eventId,
          }),
          updatedAt: BigInt(Date.now()),
        },
      });
    });
  }

  private async handlePaymentFailed(
    eventId: string,
    paymentIntent: Stripe.PaymentIntent,
  ) {
    await this.prismaService.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          paymentIntentId: paymentIntent.id,
        },
        include: {
          orderItems: true,
        },
      });

      if (!order) {
        this.logger.warn(`Payment intent has no local order: ${paymentIntent.id}`);
        return;
      }

      if (order.status !== OrderStatus.PENDING) {
        return;
      }

      await this.releaseReservations(tx, order);

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentInfo: this.buildPaymentInfo(order.paymentInfo, {
            provider: 'stripe',
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            eventId,
          }),
          updatedAt: BigInt(Date.now()),
        },
      });
    });
  }

  private async releaseReservations(
    tx: Prisma.TransactionClient,
    order: OrderWithItems,
  ) {
    const reservations = await tx.reservationInventory.findMany({
      where: {
        userId: order.userId,
        inventoryId: {
          in: order.orderItems.map((item) => item.inventoryId),
        },
        valid: true,
        isConfirmed: false,
      },
    });

    for (const reservation of reservations) {
      const released = await tx.reservationInventory.updateMany({
        where: {
          id: reservation.id,
          valid: true,
          isConfirmed: false,
        },
        data: {
          valid: false,
          updatedAt: BigInt(Date.now()),
        },
      });

      if (released.count === 1) {
        await tx.inventory.update({
          where: { id: reservation.inventoryId },
          data: {
            inventoryStock: { increment: reservation.quantity },
            updatedAt: BigInt(Date.now()),
          },
        });
      }
    }
  }

  private async findOrderForPaymentIntent(
    paymentIntentId: string,
    account: JWTdecode,
  ) {
    const scopedWhere: Prisma.OrderWhereInput = {
      paymentIntentId,
    };

    if (account.role === AccountType.USER) {
      scopedWhere.userId = account.accountId;
    } else if (account.role === AccountType.SHOP) {
      scopedWhere.shopBusinessId = account.accountId;
    } else if (
      account.role !== AccountType.ADMIN &&
      account.role !== AccountType.SUPER_ADMIN
    ) {
      throw new ForbiddenException('You do not have permission to access this payment');
    }

    return this.prismaService.order.findFirst({
      where: scopedWhere,
    });
  }

  private buildPaymentInfo(
    existing: Prisma.JsonValue,
    stripeUpdate: Record<string, unknown>,
  ) {
    const existingObject =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? existing
        : {};

    return {
      ...existingObject,
      stripe: {
        ...((existingObject as Record<string, any>).stripe ?? {}),
        ...stripeUpdate,
      },
    };
  }

  private toPaymentIntentResponse(paymentIntent: Stripe.PaymentIntent) {
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      amountReceived: paymentIntent.amount_received,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
    };
  }
}
