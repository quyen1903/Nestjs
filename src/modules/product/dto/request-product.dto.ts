import {
    IsNotEmpty,
    IsNumber,
    IsString,
    IsArray,
    IsObject,
    IsOptional,
    IsBoolean,
    IsInt,
    ValidateNested, 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpuDTO {
    @ApiProperty({
        description: 'SPU name',
        example: 'iPhone 15 Pro Max',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Product introduction/description',
        example: 'Latest iPhone with advanced camera features',
        type: String
    })
    @IsString()
    @IsOptional()
    intro?: string;

    @ApiProperty({
        description: 'Brand ID',
        example: '60f1b2b3c9b4a12345678901',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    brandId: string;

    @ApiProperty({
        description: 'Category ID',
        example: '60f1b2b3c9b4a12345678902',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @ApiPropertyOptional({
        description: 'Array of product image URLs',
        example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        type: [String],
        isArray: true
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @ApiPropertyOptional({
        description: 'After sales service information',
        example: '1 year warranty included',
        type: String
    })
    @IsString()
    @IsOptional()
    afterSalesService?: string;

    @ApiPropertyOptional({
        description: 'Detailed product content',
        example: 'Detailed specifications and features...',
        type: String
    })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiPropertyOptional({
        description: 'Product attributes in JSON string format',
        example: '{"color": ["Red", "Blue"], "storage": ["128GB", "256GB"]}',
        type: String
    })
    @IsString()
    @IsOptional()
    attributeList?: string;

    @ApiPropertyOptional({
        description: 'Whether the product is marketable',
        example: true,
        type: Boolean,
        default: true
    })
    @IsBoolean()
    @IsOptional()
    isMarketable?: boolean;

    @ApiPropertyOptional({
        description: 'Product status (0: inactive, 1: active)',
        example: 1,
        type: Number,
        enum: [0, 1],
        default: 0
    })
    @IsInt()
    @IsOptional()
    status?: number;
}

export class CreateSkuDTO {
    @ApiProperty({
        description: 'SKU name',
        example: 'iPhone 15 Pro Max - 256GB - Deep Purple',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'SKU price in cents or smallest currency unit',
        example: 129900,
        type: Number,
        minimum: 0
    })
    @IsNumber()
    @IsNotEmpty()
    price: number;

    @ApiPropertyOptional({
        description: 'Available quantity/stock',
        example: 100,
        type: Number,
        minimum: 0
    })
    @IsOptional()
    @IsNumber()
    stock?: number;

    @ApiPropertyOptional({
        description: 'Main SKU image URL',
        example: 'https://example.com/sku-image.jpg',
        type: String
    })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiPropertyOptional({
        description: 'Array of SKU image URLs',
        example: ['https://example.com/sku1.jpg', 'https://example.com/sku2.jpg'],
        type: [String],
        isArray: true
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @ApiPropertyOptional({
        description: 'Brand name for this SKU',
        example: 'Apple',
        type: String
    })
    @IsString()
    @IsOptional()
    brandName?: string;

    @ApiPropertyOptional({
        description: 'SKU specific attributes in JSON string format',
        example: '{"color": "Deep Purple", "storage": "256GB"}',
        type: String
    })
    @IsString()
    @IsOptional()
    attributes?: string;

    @ApiPropertyOptional({
        description: 'SKU status (0: inactive, 1: active)',
        example: 1,
        type: Number,
        enum: [0, 1],
        default: 0
    })
    @IsInt()
    @IsOptional()
    status?: number;
}

export class CreateProductDTO {
    @ApiProperty({
        description: 'SPU (Standard Product Unit) data',
        type: CreateSpuDTO
    })
    @ValidateNested()
    @Type(() => CreateSpuDTO)
    spu: CreateSpuDTO;

    @ApiProperty({
        description: 'SKU (Stock Keeping Unit) data',
        type: CreateSkuDTO
    })
    @ValidateNested()
    @Type(() => CreateSkuDTO)
    sku: CreateSkuDTO;
}

export class CreateBrandDTO {
    @ApiProperty({
        description: 'Brand name',
        example: 'Apple',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Brand logo/image URL',
        example: 'https://example.com/apple-logo.png',
        type: String
    })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiPropertyOptional({
        description: 'Brand initial letter for sorting',
        example: 'A',
        type: String,
        maxLength: 1
    })
    @IsString()
    @IsOptional()
    initial?: string;

    @ApiPropertyOptional({
        description: 'Sort order for brand display',
        example: 100,
        type: Number,
        minimum: 0
    })
    @IsOptional()
    @IsNumber()
    sort?: number;
}

export class CreateCategoryDTO {
    @ApiProperty({
        description: 'Category name',
        example: 'Smartphones',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    name: string;
}
