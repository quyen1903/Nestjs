import { IsNotEmpty, IsOptional, IsString, ValidateNested, IsArray, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class ItemProductDTO{
    @IsNumber()
    @IsOptional()
    price?: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    quantity: number;

    @IsString()
    @IsNotEmpty()
    productId: string;

    shopId?: string;

    name?: string;

}

export class ShopDiscountDTO{
    @IsString()
    @IsNotEmpty()
    shopId: string;

    @IsString()
    @IsNotEmpty()
    discountId: string;

    @IsString()
    @IsNotEmpty()
    codeId: string;
}

export class ShopOrderIdDTO{
    @IsString()
    @IsNotEmpty()
    shopId: string;

    @IsArray()
    @IsOptional()
    @Type(()=>ShopDiscountDTO)
    shopDiscounts: ShopDiscountDTO[];

    @ValidateNested({each: true})
    @Type(() => ItemProductDTO)
    itemProducts:ItemProductDTO[];

}

export class CheckoutDTO{
    @IsString()
    @IsNotEmpty()
    cartId: string;

    @IsArray()
    @ValidateNested()
    @Type(() => ShopOrderIdDTO)
    shopOrderIds:ShopOrderIdDTO[];
}
