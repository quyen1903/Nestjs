import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ItemProductDTO {
    @ApiProperty({ example: 2 })
    @IsInt()
    @IsNotEmpty()
    quantity: number;

    @ApiProperty({ example: 999 })
    @IsNumber()
    @IsNotEmpty()
    price: number;

    @ApiProperty({ example: 'shop_123' })
    @IsString()
    @IsNotEmpty()
    shopId: string;

    @ApiPropertyOptional({ example: 1 })
    @IsInt()
    @IsOptional()
    oldQuantity?: number;

    @ApiProperty({ example: 'sku_123' })
    @IsString()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({ example: 'iPhone 15 Pro' })
    @IsString()
    @IsNotEmpty()
    name: string;
}

class ShopOrderDTO {
    @ApiProperty({ example: 'shop_123' })
    @IsString()
    @IsNotEmpty()
    shopId: string;

    @ApiProperty({ type: () => [ItemProductDTO] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemProductDTO)
    itemProducts: ItemProductDTO[];

    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    version: number;
}

export class UpdateCartDTO {
    @ApiProperty({ example: 'user_123' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ type: () => [ShopOrderDTO] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ShopOrderDTO)
    shopOrderIds: ShopOrderDTO[];
}
