import {
  ItemProductDTO,
  ShopDiscountDTO,
  ShopOrderIdDTO,
} from '../dto/checkout.dto';

export interface CheckoutTotals {
  totalPrice: number;
  feeShip: number;
  totalDiscount: number;
  totalCheckout: number;
}

export interface ShopCheckout {
  shopId: string;
  shopDiscounts: ShopDiscountDTO[];
  priceRaw: number;
  priceApplyDiscount: number;
  itemProducts: ItemProductDTO[];
}

export interface CheckoutReview {
  shopOrderIds: ShopOrderIdDTO[];
  reviewedOrders: ShopCheckout[];
  checkoutOrder: CheckoutTotals;
}

export interface LockedInventory {
  id: string;
  inventoryProductId: string;
  inventoryStock: number;
}

export interface UserOrderUpdate {
  shippingAddress?: string;
}
