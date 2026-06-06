import { Type } from "class-transformer";
import { IsNumber, IsString, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProductDTO{
    @ApiProperty({ example: 'sku_123', description: 'Product/SKU id' })
    @IsString()
    productId: string

    @ApiProperty({ example: 'shop_123', description: 'Shop id that owns this product' })
    @IsString()
    shopId: string

    @ApiProperty({ example: 2, description: 'Quantity to add' })
    @IsNumber()
    quantity: number

    @ApiProperty({ example: 'iPhone 15 Pro', description: 'Product display name' })
    @IsString()
    name: string

    @ApiProperty({ example: 999, description: 'Product unit price' })
    @IsNumber()
    price: number
}

export class CreateCartDTO{
    @ApiProperty({ example: 'user_123', description: 'User id' })
    @IsString()
    userId: string

    @ApiProperty({ type: () => CreateProductDTO })
    @ValidateNested()
    @Type(()=> CreateProductDTO)
    product: CreateProductDTO
}
