
import { ShopDiscountDTO, ItemProductDTO } from "../dto/checkout.dto"
export interface ItemCheckout{
    shopId: string;
    shopDiscounts: ShopDiscountDTO[];
    priceRaw: number;
    priceApplyDiscount: number;
    itemProducts: ItemProductDTO[];
}