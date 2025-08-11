import {
    IsNotEmpty,
    IsNumber,
    IsString,
    IsEnum,
    ValidateNested,
    IsObject,
    IsOptional
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';


enum ProductType {
    CLOTHING = 'Clothing',
    ELECTRONIC = 'Electronic',
    FURNITURE = 'Furniture'
}

class PartialClothingDTO extends PartialType(ClothingDTO) {}
class PartialElectronicDTO extends PartialType(ElectronicDTO) {}
class PartialFurnitureDTO extends PartialType(FurnitureDTO) {}

function resolveProductAttributes(productType: ProductType) {
    switch (productType) {
        case ProductType.CLOTHING:
            return PartialClothingDTO;
        case ProductType.ELECTRONIC:
            return PartialElectronicDTO;
        case ProductType.FURNITURE:
            return PartialFurnitureDTO;
        default:
            return Object;
    }
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

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type((obj) => resolveProductAttributes(obj?.object.productType))
    productAttributes?: PartialClothingDTO | PartialElectronicDTO | PartialFurnitureDTO;
}