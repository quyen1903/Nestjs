import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ItemProductDTO {
    @IsInt()
    @IsNotEmpty()
    @Min(0)
    quantity: number;

    @IsInt()
    @IsOptional()
    oldQuantity?: number;

    @IsString()
    @IsNotEmpty()
    productId: string;
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
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ShopOrderDTO)
    shopOrderIds: ShopOrderDTO[];
}
