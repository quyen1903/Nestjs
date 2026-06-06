import { Injectable } from '@nestjs/common';
import { DrizzleService, DrizzleTransactionClient } from 'src/database/drizzle.service';
import { Cart, OrderStatus } from 'src/database/types';
import { ItemProductDTO } from '../dto/checkout.dto';
import {
  LockedInventory,
  ShopCheckout,
  UserOrderUpdate,
} from '../domain/checkout.types';

type TxClient = DrizzleTransactionClient;

@Injectable()
export class CheckoutRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  transaction<T>(handler: (tx: TxClient) => Promise<T>): Promise<T> {
    return this.drizzleService.$transaction(handler);
  }

  getCartById(cartId: string): Promise<Cart | null> {
    return this.drizzleService.cart.findFirst({
      where: { id: cartId },
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
    return tx.inventory.update({
      where: { id: inventoryId },
      data: { inventoryStock: { decrement: quantity } },
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
      this.drizzleService.order.findMany({
        where: whereClause,
        include: this.getOrderListInclude(),
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.drizzleService.order.count({
        where: whereClause,
      }),
    ]);
  }

  getOneOrderByUser(orderId: string, userId: string) {
    return this.drizzleService.order.findFirst({
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
