import {
    IsNotEmpty,
    IsNumber,
    IsString,
    IsEnum,
    ValidateNested,
    IsObject,
} from 'class-validator';
import { ClothingDTO } from './product/clothing.products';
import { ElectronicDTO } from './product/electronic.products';
import { FurnitureDTO } from './product/furniture.products';
enum ProductType {
    CLOTHING = 'Clothing',
    ELECTRONIC = 'Electronic',
    FURNITURE = 'Furniture'
}


export class CreateProductDTO {
    @IsNotEmpty()
    @IsString()
    productName: string;

    @IsNotEmpty()
    @IsString()
    productThumb: string;

    @IsNotEmpty()
    @IsString()
    productDescription: string;

    @IsNotEmpty()
    @IsNumber()
    productPrice: number;

    @IsNotEmpty()
    @IsNumber()
    productQuantity: number;

    @IsNotEmpty()
    @IsEnum(ProductType)
    productType: ProductType;

    @IsNotEmpty()
    @IsObject()
    @ValidateNested() // To recursively validate nested objects
    productAttributes: ClothingDTO | ElectronicDTO | FurnitureDTO;

    // constructor({
    //     productName,
    //     productThumb,
    //     productDescription,
    //     productPrice,
    //     productQuantity,
    //     productType,
    //     productAttributes,
    // }: {
    //     productName: string;
    //     productThumb: string;
    //     productDescription: string;
    //     productPrice: number;
    //     productQuantity: number;
    //     productType: ProductType;
    //     productAttributes: Clothing | Electronics | Furniture;
    // }) {
    //     this.productName = productName;
    //     this.productThumb = productThumb;
    //     this.productDescription = productDescription;
    //     this.productPrice = productPrice;
    //     this.productQuantity = productQuantity;
    //     this.product_type = productType;
    //     this.productAttributes = productAttributes;
    // }
}