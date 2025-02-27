import { IsString, IsNotEmpty, IsArray, ValidateNested, IsInt, IsNumber } from "class-validator";
import { Type } from 'class-transformer';

class Product {
    @IsString()
    productId: string;

    @IsInt()
    quantity: number;

    @IsNumber()
    price: number;
}

export class AmountDiscountDTO {
    @IsString()
    discountCode: string;
//not created user's id yet, will create user later on
    @IsString()
    discountUserId?: string;

    @IsString()
    @IsNotEmpty()
    discountShopId: string;

    @IsArray()
    @ValidateNested()
    @Type(() => Product)
    discountProducts: Product[];
}