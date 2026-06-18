import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus } from 'prisma/generated/prisma';
import { DiscountService } from 'src/modules/discount/discount.service';
import { ProductService } from 'src/modules/product/product.service';
import {
  CheckoutDTO,
  ItemProductDTO,
  ShopDiscountDTO,
  ShopOrderIdDTO,
} from '../dto/checkout.dto';
import { CheckoutPricingService } from '../domain/checkout-pricing.service';
import { CheckoutReview, UserOrderUpdate } from '../domain/checkout.types';
import { OrderPolicy } from '../domain/order-policy';
import { CheckoutRepository } from '../infrastructure/checkout.repository';

type CheckoutCommand = CheckoutDTO & { userId: string };
type CartProductSnapshot = { productId: string; quantity: number };

@Injectable()
export class CheckoutApplicationService {
  private readonly pricing = new CheckoutPricingService();

  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly discountService: DiscountService,
    private readonly productService: ProductService,
  ) {}

  async checkoutReview({
    cartId,
    userId,
    shopOrderIds,
  }: CheckoutCommand): Promise<CheckoutReview> {
    return this.checkoutRepository.transaction(async (tx) => {
      const cart = await this.checkoutRepository.getCartByIdForUser(
        tx,
        cartId,
        userId,
      );
      if (!cart) {
        throw new BadRequestException('Cart does not existed!!');
      }

      const cartProducts = await this.checkoutRepository.getCartProducts(
        tx,
        cart.id,
      );
      this.assertRequestedItemsBelongToCart(shopOrderIds, cartProducts);

      const reviewedOrders = [];
      let checkoutOrder = this.pricing.createEmptyTotals();

      for (const { shopId, shopDiscounts = [], itemProducts } of shopOrderIds) {
        const checkProductServer = await this.getCheckedProducts(
          shopId,
          itemProducts,
        );

        for (const product of checkProductServer) {
          const inventory =
            await this.checkoutRepository.lockInventoryByProductId(
              tx,
              product.productId,
            );

          if (!inventory || inventory.inventoryStock < product.quantity) {
            throw new BadRequestException(
              `Not enough stock for product ID ${product.productId}`,
            );
          }
        }

        let itemCheckout = this.pricing.createShopCheckout(
          shopId,
          shopDiscounts,
          checkProductServer,
        );
        const discount = await this.calculateDiscount(
          userId,
          shopId,
          shopDiscounts,
          checkProductServer,
        );

        if (discount > 0) {
          itemCheckout = this.pricing.applyDiscount(itemCheckout, discount);
        }

        checkoutOrder = this.pricing.addShopCheckout(
          checkoutOrder,
          itemCheckout,
        );
        reviewedOrders.push(itemCheckout);
      }

      return {
        shopOrderIds: reviewedOrders.map(
          ({ shopId, shopDiscounts, itemProducts }) => ({
            shopId,
            shopDiscounts,
            itemProducts,
          }),
        ),
        reviewedOrders,
        checkoutOrder,
      };
    });
  }

  async createOrderByUser(
    shopOrderIds: ShopOrderIdDTO[],
    cartId: string,
    userId: string,
  ) {
    const { reviewedOrders } = await this.checkoutReview({
      cartId,
      userId,
      shopOrderIds,
    });

    return this.checkoutRepository.transaction(async (tx) => {
      const createdOrders = [];

      for (const shopCheckout of reviewedOrders) {
        const order = await this.checkoutRepository.createPendingOrder(
          tx,
          userId,
          shopCheckout,
        );

        for (const item of shopCheckout.itemProducts) {
          const inventory =
            await this.checkoutRepository.lockInventoryByProductId(
              tx,
              item.productId,
            );

          if (!inventory || inventory.inventoryStock < item.quantity) {
            throw new BadRequestException(
              `Not enough stock for product ID ${item.productId}`,
            );
          }

          await this.checkoutRepository.reserveInventory(
            tx,
            userId,
            inventory.id,
            item.quantity,
          );
          const decrementResult = await this.checkoutRepository.decrementInventory(
            tx,
            inventory.id,
            item.quantity,
          );

          if (decrementResult.count !== 1) {
            throw new BadRequestException(
              `Not enough stock for product ID ${item.productId}`,
            );
          }

          await this.checkoutRepository.createOrderItem(
            tx,
            order.id,
            inventory.id,
            item,
          );
        }

        for (const discount of shopCheckout.shopDiscounts ?? []) {
          await this.checkoutRepository.consumeDiscountForOrder(tx, {
            discountCode: discount.codeId,
            discountShopId: shopCheckout.shopId,
            userId,
          });
        }

        createdOrders.push(order);
      }

      await this.checkoutRepository.clearCart(tx, cartId);

      return {
        orders: createdOrders,
        totalOrders: createdOrders.length,
        message: 'Orders created successfully',
      };
    });
  }

  async getOrdersByUser(
    userId: string,
    page = 1,
    limit = 10,
    status?: OrderStatus,
  ) {
    const [orders, totalCount] = await this.checkoutRepository.getOrdersByUser(
      userId,
      page,
      limit,
      status,
    );

    return {
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    };
  }

  async getOneOrdersByUser(orderId: string, userId: string) {
    const order = await this.checkoutRepository.getOneOrderByUser(
      orderId,
      userId,
    );

    if (!order) {
      throw new BadRequestException('Order not found or access denied');
    }

    return order;
  }

  async cancelOrderByUser(orderId: string, userId: string, reason?: string) {
    return this.checkoutRepository.transaction(async (tx) => {
      const order = await this.checkoutRepository.getOrderForCancel(
        tx,
        orderId,
        userId,
      );

      if (!order) {
        throw new BadRequestException('Order not found or access denied');
      }

      OrderPolicy.assertCanCancel(order.status);

      const cancelledOrder = await this.checkoutRepository.cancelOrder(
        tx,
        orderId,
      );

      for (const orderItem of order.orderItems) {
        await this.checkoutRepository.restoreInventory(
          tx,
          orderItem.inventoryId,
          orderItem.quantity,
        );
        await this.checkoutRepository.invalidateReservation(
          tx,
          userId,
          orderItem.inventoryId,
        );
      }

      return {
        order: cancelledOrder,
        message: `Order ${orderId} has been successfully cancelled`,
        restoredItems: order.orderItems.length,
      };
    });
  }

  async updateOrdersByUser(
    orderId: string,
    userId: string,
    updateData: UserOrderUpdate,
  ) {
    return this.checkoutRepository.transaction(async (tx) => {
      const existingOrder = await this.checkoutRepository.getOrderForUpdate(
        tx,
        orderId,
        userId,
      );

      if (!existingOrder) {
        throw new BadRequestException('Order not found or access denied');
      }

      OrderPolicy.assertCanUpdateShippingAddress(existingOrder.status);

      const allowedUpdates: UserOrderUpdate = {};

      if (updateData.shippingAddress?.trim()) {
        allowedUpdates.shippingAddress = updateData.shippingAddress.trim();
      }

      if (Object.keys(allowedUpdates).length === 0) {
        throw new BadRequestException('No valid fields provided for update');
      }

      const updatedOrder = await this.checkoutRepository.updateOrderByUser(
        tx,
        orderId,
        allowedUpdates,
      );

      return {
        order: updatedOrder,
        message: 'Order updated successfully',
      };
    });
  }

  private async getCheckedProducts(
    shopId: string,
    itemProducts: ItemProductDTO[],
  ): Promise<ItemProductDTO[]> {
    const checkProductServer =
      await this.productService.checkProductByServer(itemProducts);
    const products = checkProductServer.filter(Boolean) as ItemProductDTO[];

    if (products.length !== itemProducts.length) {
      throw new BadRequestException('order wrong !!!');
    }

    if (products.some((product) => product.shopId !== shopId)) {
      throw new BadRequestException('Product does not belong to requested shop');
    }

    return products;
  }

  private assertRequestedItemsBelongToCart(
    shopOrderIds: ShopOrderIdDTO[],
    cartProducts: CartProductSnapshot[],
  ) {
    const cartQuantityByProductId = new Map(
      cartProducts.map((product) => [product.productId, product.quantity]),
    );
    const requestedQuantityByProductId = new Map<string, number>();

    for (const shopOrder of shopOrderIds) {
      for (const product of shopOrder.itemProducts) {
        requestedQuantityByProductId.set(
          product.productId,
          (requestedQuantityByProductId.get(product.productId) ?? 0) +
            product.quantity,
        );
      }
    }

    for (const [productId, requestedQuantity] of requestedQuantityByProductId) {
      const cartQuantity = cartQuantityByProductId.get(productId);

      if (!cartQuantity || requestedQuantity > cartQuantity) {
        throw new BadRequestException('Checkout item is not in the user cart');
      }
    }
  }

  private async calculateDiscount(
    userId: string,
    shopId: string,
    shopDiscounts: ShopDiscountDTO[],
    products: ItemProductDTO[],
  ): Promise<number> {
    let discount = 0;
    const seenDiscountCodes = new Set<string>();

    for (const shopDiscount of shopDiscounts) {
      if (seenDiscountCodes.has(shopDiscount.codeId)) {
        throw new BadRequestException('Duplicate discount code in checkout');
      }
      seenDiscountCodes.add(shopDiscount.codeId);

      const result = await this.discountService.getDiscountAmount({
        discountCode: shopDiscount.codeId,
        discountUserId: userId,
        discountShopId: shopId,
        discountProducts: products.map((product) => ({
          productId: product.productId,
          quantity: product.quantity,
          price: product.price ?? 0,
        })),
      });

      discount += result.discount;
    }

    return discount;
  }
}
