import { Type } from "class-transformer";
import { IsInt, IsString, Min, ValidateNested } from "class-validator";

export class CreateProductDTO{
    @IsString()
    productId: string

    @IsInt()
    @Min(1)
    quantity: number
}

export class CreateCartDTO{
    @ValidateNested()
    @Type(()=> CreateProductDTO)
    product: CreateProductDTO
}
