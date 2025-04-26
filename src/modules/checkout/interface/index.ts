
import { ShopDiscountDTO, ItemProductDTO } from "../dto/checkout.dto"
export interface ShopCheckout{
    shopId: string;
    shopDiscounts: ShopDiscountDTO[];
    priceRaw: number;
    priceApplyDiscount: number;
    itemProducts: ItemProductDTO[];
}