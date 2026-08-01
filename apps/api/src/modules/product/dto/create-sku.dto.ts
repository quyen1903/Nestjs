import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsArray,
    IsInt
} from "class-validator";

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
