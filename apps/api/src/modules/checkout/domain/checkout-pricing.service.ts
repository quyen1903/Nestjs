import { BadRequestException } from '@nestjs/common';
import { ItemProductDTO, ShopDiscountDTO } from '../dto/checkout.dto';
import { CheckoutTotals, ShopCheckout } from './checkout.types';

export class CheckoutPricingService {
  createEmptyTotals(): CheckoutTotals {
    return {
      totalPrice: 0,
      feeShip: 0,
      totalDiscount: 0,
      totalCheckout: 0,
    };
  }

  calculateProductsPrice(products: ItemProductDTO[]): number {
    return products.reduce(
      (total, product) => total + product.quantity * product.price,
      0,
    );
  }

  createShopCheckout(
    shopId: string,
    shopDiscounts: ShopDiscountDTO[],
    itemProducts: ItemProductDTO[],
  ): ShopCheckout {
    const priceRaw = this.calculateProductsPrice(itemProducts);

    return {
      shopId,
      shopDiscounts,
      priceRaw,
      priceApplyDiscount: priceRaw,
      itemProducts,
    };
  }

  applyDiscount(shopCheckout: ShopCheckout, discount: number): ShopCheckout {
    if (discount < 0) {
      throw new BadRequestException('Discount cannot be negative');
    }

    return {
      ...shopCheckout,
      priceApplyDiscount: Math.max(shopCheckout.priceRaw - discount, 0),
    };
  }

  addShopCheckout(
    totals: CheckoutTotals,
    shopCheckout: ShopCheckout,
  ): CheckoutTotals {
    const totalDiscount =
      shopCheckout.priceRaw - shopCheckout.priceApplyDiscount;

    return {
      ...totals,
      totalPrice: totals.totalPrice + shopCheckout.priceRaw,
      totalDiscount: totals.totalDiscount + totalDiscount,
      totalCheckout: totals.totalCheckout + shopCheckout.priceApplyDiscount,
    };
  }
}
