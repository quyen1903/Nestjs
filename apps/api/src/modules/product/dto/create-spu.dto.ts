import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
    IsNotEmpty,
    IsBoolean,
    IsOptional,
    IsString,
    IsArray,
    IsInt
} from "class-validator";

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

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Business ID of Shopt',
        example: '1234-5678-9012-3456',
        type: String
    })
    shopBusinessId: string;
}
