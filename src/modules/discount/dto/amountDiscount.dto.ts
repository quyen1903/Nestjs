import { IsString, IsNotEmpty, IsArray, ValidateNested, IsInt, IsNumber } from "class-validator";
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class Product {
    @ApiProperty({ example: 'sku_123' })
    @IsString()
    productId: string;

    @ApiProperty({ example: 2 })
    @IsInt()
    quantity: number;

    @ApiProperty({ example: 999 })
    @IsNumber()
    price: number;
}

export class AmountDiscountDTO {
    @ApiProperty({ example: 'SUMMER2026' })
    @IsString()
    discountCode: string;
//not created user's id yet, will create user later on
    @ApiPropertyOptional({ example: 'user_123' })
    @IsString()
    discountUserId?: string;

    @ApiProperty({ example: 'shop_123' })
    @IsString()
    @IsNotEmpty()
    discountShopId: string;

    @ApiProperty({ type: () => [Product] })
    @IsArray()
    @ValidateNested()
    @Type(() => Product)
    discountProducts: Product[];
}
