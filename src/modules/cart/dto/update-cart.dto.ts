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

class ItemProductDTO {
    @IsInt()
    @IsNotEmpty()
    quantity: number;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsString()
    @IsNotEmpty()
    shopId: string;

    @IsInt()
    @IsOptional()
    oldQuantity?: number;

    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}

class ShopOrderDTO {
    @IsString()
    @IsNotEmpty()
    shopId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemProductDTO)
    itemProducts: ItemProductDTO[];

    @IsInt()
    @IsNotEmpty()
    version: number;
}

export class UpdateCartDTO {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ShopOrderDTO)
    shopOrderIds: ShopOrderDTO[];
}
