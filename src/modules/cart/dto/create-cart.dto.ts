import { Type } from "class-transformer";
import { IsNumber, IsString, ValidateNested } from "class-validator";

export class CreateProductDTO{
    @IsString()
    productId: string

    @IsString()
    shopId: string

    @IsNumber()
    quantity: number

    @IsString()
    name: string

    @IsNumber()
    price: number
}

export class CreateCartDTO{
    @IsString()
    userId: string

    @ValidateNested()
    @Type(()=> CreateProductDTO)
    product: CreateProductDTO
}