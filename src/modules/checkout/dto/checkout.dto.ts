import { IsNotEmpty, IsOptional, IsString, ValidateNested, IsArray, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ItemProductDTO{
    @ApiProperty({ example: 999 })
    @IsNumber()
    @IsNotEmpty()
    price: number;

    @ApiProperty({ example: 2 })
    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @ApiProperty({ example: 'sku_123' })
    @IsString()
    @IsNotEmpty()
    productId: string;

}

export class ShopDiscountDTO{
    @ApiProperty({ example: 'shop_123' })
    @IsString()
    @IsNotEmpty()
    shopId: string;

    @ApiProperty({ example: 'discount_123' })
    @IsString()
    @IsNotEmpty()
    discountId: string;

    @ApiProperty({ example: 'SUMMER2026' })
    @IsString()
    @IsNotEmpty()
    codeId: string;
}

export class ShopOrderIdDTO{
    @ApiProperty({ example: 'shop_123' })
    @IsString()
    @IsNotEmpty()
    shopId: string;

    @ApiPropertyOptional({ type: () => [ShopDiscountDTO] })
    @IsArray()
    @IsOptional()
    @Type(()=>ShopDiscountDTO)
    shopDiscounts: ShopDiscountDTO[];

    @ApiProperty({ type: () => [ItemProductDTO] })
    @ValidateNested({each: true})
    @Type(() => ItemProductDTO)
    itemProducts:ItemProductDTO[];

}

export class CheckoutDTO{
    @ApiProperty({ example: 'cart_123' })
    @IsString()
    @IsNotEmpty()
    cartId: string;

    @ApiProperty({ example: 'user_123' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ type: () => [ShopOrderIdDTO] })
    @IsArray()
    @ValidateNested()
    @Type(() => ShopOrderIdDTO)
    shopOrderIds:ShopOrderIdDTO[];
}
