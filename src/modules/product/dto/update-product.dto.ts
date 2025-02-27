import {
    IsNotEmpty,
    IsNumber,
    IsString,
    IsEnum,
    ValidateNested,
    IsObject,
    IsOptional
} from 'class-validator';
import { ClothingDTO } from './product/clothing.products';
import { ElectronicDTO } from './product/electronic.products';
import { FurnitureDTO } from './product/furniture.products';

enum ProductType {
    CLOTHING = 'Clothing',
    ELECTRONIC = 'Electronic',
    FURNITURE = 'Furniture'
}

export class UpdateProductDTO {
    @IsOptional()
    @IsString()
    productName: string;

    @IsOptional()
    @IsString()
    productThumb: string;

    @IsOptional()
    @IsString()
    productDescription: string;

    @IsOptional()
    @IsNumber()
    productPrice: number;

    @IsOptional()
    @IsNumber()
    productQuantity: number;

    @IsOptional()
    @IsEnum(ProductType)
    productType: ProductType;

    @IsNotEmpty()
    @IsObject()
    @ValidateNested() // To recursively validate nested objects
    productAttributes?: Partial<ClothingDTO | ElectronicDTO | FurnitureDTO>;
}