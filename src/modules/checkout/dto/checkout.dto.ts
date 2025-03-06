import { IsNotEmpty, IsOptional, IsString, ValidateNested, IsArray, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class ItemProductDTO{
    @IsNumber()
    @IsNotEmpty()
    price: number

    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @IsString()
    @IsNotEmpty()
    productId: string
}

export class ShopDiscountDTO{
    @IsString()
    @IsNotEmpty()
    shopId: string

    @IsString()
    @IsNotEmpty()
    discountId: string

    @IsString()
    @IsNotEmpty()
    codeId: string
}

export class ShopOrderIdDTO{
    @IsString()
    @IsNotEmpty()
    shopId: string;

    @IsArray()
    @IsOptional()
    @Type(()=>ShopDiscountDTO)
    shopDiscounts: ShopDiscountDTO[];

    @IsOptional()
    @ValidateNested()
    @Type(() => ItemProductDTO)
    itemProducts:ItemProductDTO

}

export class CheckoutDTO{
    @IsString()
    @IsNotEmpty()
    cartId: string;

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsArray()
    @ValidateNested()
    @Type(() => ShopOrderIdDTO)
    shopOrderIds:ShopOrderIdDTO[]
}