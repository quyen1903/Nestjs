import { BadRequestException, Injectable } from '@nestjs/common';
import { Cart, Discount, OrderStatus, Prisma } from 'prisma/generated/prisma';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { ItemProductDTO } from '../dto/checkout.dto';
import {
  LockedInventory,
  ShopCheckout,
  UserOrderUpdate,
} from '../domain/checkout.types';

type TxClient = Prisma.TransactionClient;
type LockedDiscount = Pick<
  Discount,
  | 'id'
  | 'discountUsesCount'
  | 'discountMaxUses'
  | 'discountMaxUsesPerUser'
  | 'discountUsersUsed'
>;

@Injectable()
export class CheckoutRepository {
  constructor(private readonly prismaService: PrismaService) {}

  transaction<T>(handler: (tx: TxClient) => Promise<T>): Promise<T> {
    return this.prismaService.$transaction(handler);
  }

  getCartByIdForUser(
    tx: TxClient,
    cartId: string,
    userId: string,
  ): Promise<Cart | null> {
    return tx.cart.findFirst({
      where: { id: cartId, userId },
    });
  }

  getCartProducts(tx: TxClient, cartId: string) {
    return tx.cartProduct.findMany({
      where: {
        cartId,
        isActive: true,
      },
      select: {
        productId: true,
        quantity: true,
      },
    });
  }

  async lockInventoryByProductId(
    tx: TxClient,
    productId: string,
  ): Promise<LockedInventory | null> {
    const inventories = await tx.$queryRaw<LockedInventory[]>`
      SELECT
        id,
        inventory_product_id as "inventoryProductId",
        inventory_stock as "inventoryStock"
      FROM inventories
      WHERE inventory_product_id = ${productId}
      FOR UPDATE
    `;

    return inventories[0] ?? null;
  }

  createPendingOrder(tx: TxClient, userId: string, shopCheckout: ShopCheckout) {
    return tx.order.create({
      data: {
        userId,
        shopBusinessId: shopCheckout.shopId,
        status: OrderStatus.PENDING,
        totalDiscount: shopCheckout.priceRaw - shopCheckout.priceApplyDiscount,
        shippingFee: 0,
        shippingAddress: 'test',
        paymentInfo: {},
        paymentIntentId: null,
        totalPrice: shopCheckout.priceApplyDiscount,
        expiredAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
  }

  reserveInventory(
    tx: TxClient,
    userId: string,
    inventoryId: string,
    quantity: number,
  ) {
    return tx.reservationInventory.create({
      data: {
        userId,
        inventoryId,
        quantity,
        expiredAt: new Date(Date.now() + 5 * 60 * 1000),
        isConfirmed: false,
        valid: true,
      },
    });
  }

  decrementInventory(tx: TxClient, inventoryId: string, quantity: number) {
    return tx.inventory.updateMany({
      where: {
        id: inventoryId,
        inventoryStock: {
          gte: quantity,
        },
      },
      data: {
        inventoryStock: { decrement: quantity },
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  createOrderItem(
    tx: TxClient,
    orderId: string,
    inventoryId: string,
    item: ItemProductDTO,
  ) {
    return tx.orderItem.create({
      data: {
        orderId,
        inventoryId,
        quantity: item.quantity,
        price: item.price,
      },
    });
  }

  async clearCart(tx: TxClient, cartId: string) {
    await tx.cartProduct.deleteMany({
      where: {
        cartId,
      },
    });

    return tx.cart.update({
      where: {
        id: cartId,
      },
      data: {
        countProduct: 0,
      },
    });
  }

  getOrdersByUser(
    userId: string,
    page: number,
    limit: number,
    status?: OrderStatus,
  ) {
    const skip = (page - 1) * limit;
    const whereClause = {
      userId,
      isActive: true,
      ...(status && { status }),
    };

    return Promise.all([
      this.prismaService.order.findMany({
        where: whereClause,
        include: this.getOrderListInclude(),
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prismaService.order.count({
        where: whereClause,
      }),
    ]);
  }

  getOneOrderByUser(orderId: string, userId: string) {
    return this.prismaService.order.findFirst({
      where: {
        id: orderId,
        userId,
        isActive: true,
      },
      include: this.getOrderDetailInclude(),
    });
  }

  getOrderForCancel(tx: TxClient, orderId: string, userId: string) {
    return tx.order.findFirst({
      where: {
        id: orderId,
        userId,
        isActive: true,
      },
      include: {
        orderItems: {
          include: {
            inventory: true,
          },
        },
      },
    });
  }

  cancelOrder(tx: TxClient, orderId: string) {
    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  restoreInventory(tx: TxClient, inventoryId: string, quantity: number) {
    return tx.inventory.update({
      where: { id: inventoryId },
      data: {
        inventoryStock: { increment: quantity },
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  invalidateReservation(tx: TxClient, userId: string, inventoryId: string) {
    return tx.reservationInventory.updateMany({
      where: {
        userId,
        inventoryId,
        valid: true,
      },
      data: {
        valid: false,
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  async confirmReservationsForOrder(tx: TxClient, userId: string, inventoryIds: string[]) {
    if (inventoryIds.length === 0) return { count: 0 };

    return tx.reservationInventory.updateMany({
      where: {
        userId,
        inventoryId: { in: inventoryIds },
        valid: true,
        isConfirmed: false,
      },
      data: {
        isConfirmed: true,
        valid: false,
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  async consumeDiscountForOrder(
    tx: TxClient,
    params: {
      discountCode: string;
      discountShopId: string;
      userId: string;
    },
  ) {
    const discounts = await tx.$queryRaw<LockedDiscount[]>`
      SELECT
        id,
        discount_uses_count as "discountUsesCount",
        discount_max_uses as "discountMaxUses",
        discount_max_uses_per_user as "discountMaxUsesPerUser",
        discount_users_used as "discountUsersUsed"
      FROM discounts
      WHERE discount_code = ${params.discountCode}
        AND discount_shop = ${params.discountShopId}
        AND discount_is_active = true
        AND is_active = true
      FOR UPDATE
    `;
    const discount = discounts[0];

    if (!discount) {
      throw new BadRequestException('Discount does not exist');
    }

    if (discount.discountUsesCount >= discount.discountMaxUses) {
      throw new BadRequestException('Discount is out of uses');
    }

    if (
      discount.discountMaxUsesPerUser > 0 &&
      discount.discountUsersUsed.includes(params.userId)
    ) {
      throw new BadRequestException('This user already used this discount');
    }

    return tx.discount.update({
      where: { id: discount.id },
      data: {
        discountUsesCount: { increment: 1 },
        discountUsersUsed: { push: params.userId },
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  getOrderForUpdate(tx: TxClient, orderId: string, userId: string) {
    return tx.order.findFirst({
      where: {
        id: orderId,
        userId,
        isActive: true,
      },
    });
  }

  updateOrderByUser(
    tx: TxClient,
    orderId: string,
    updateData: UserOrderUpdate,
  ) {
    return tx.order.update({
      where: { id: orderId },
      data: {
        ...updateData,
        updatedAt: BigInt(Date.now()),
      },
      include: this.getOrderListInclude(),
    });
  }

  private getOrderListInclude() {
    return {
      orderItems: {
        include: {
          inventory: {
            include: {
              inventoryProduct: {
                include: {
                  spu: {
                    select: {
                      name: true,
                      images: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      shopBusiness: {
        include: {
          account: {
            include: {
              profile: {
                select: {
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      },
    };
  }

  private getOrderDetailInclude() {
    return {
      orderItems: {
        include: {
          inventory: {
            include: {
              inventoryProduct: {
                include: {
                  spu: {
                    select: {
                      id: true,
                      name: true,
                      images: true,
                      intro: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      shopBusiness: {
        include: {
          account: {
            include: {
              profile: {
                select: {
                  name: true,
                  avatar: true,
                  phone: true,
                  address: true,
                },
              },
            },
          },
        },
      },
    };
  }
}
