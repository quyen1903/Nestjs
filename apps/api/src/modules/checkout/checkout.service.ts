import { Injectable } from '@nestjs/common';
import { OrderStatus } from 'prisma/generated/prisma';
import { CheckoutApplicationService } from './application/checkout.application.service';
import { CheckoutDTO, ShopOrderIdDTO } from './dto/checkout.dto';
import { UserOrderUpdate } from './domain/checkout.types';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly checkoutApplicationService: CheckoutApplicationService,
  ) {}

  async checkoutReview({ cartId, shopOrderIds }: CheckoutDTO, userId: string) {
    return this.checkoutApplicationService.checkoutReview({
      cartId,
      userId,
      shopOrderIds,
    });
  }

  /*
        we create order before user actually pay money
        so once we create order in database, we need to keep track
        on time miles which order has been create, once it fail after 15 minutes,
        we cancel  
    */
  async createOrderByUser(
    shopOrderIds: ShopOrderIdDTO[],
    cartId: string,
    userId: string,
  ) {
    return this.checkoutApplicationService.createOrderByUser(
      shopOrderIds,
      cartId,
      userId,
    );
  }

  async getOrdersByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus,
  ) {
    return this.checkoutApplicationService.getOrdersByUser(
      userId,
      page,
      limit,
      status,
    );
  }

  async getOneOrdersByUser(orderId: string, userId: string) {
    return this.checkoutApplicationService.getOneOrdersByUser(orderId, userId);
  }

  async cancelOrderByUser(orderId: string, userId: string, reason?: string) {
    return this.checkoutApplicationService.cancelOrderByUser(
      orderId,
      userId,
      reason,
    );
  }

  async updateOrdersByUser(
    orderId: string,
    userId: string,
    updateData: UserOrderUpdate,
  ) {
    return this.checkoutApplicationService.updateOrdersByUser(
      orderId,
      userId,
      updateData,
    );
  }
}
