import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString
} from "class-validator";

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
