import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";
export class CreateCategoryDTO {
    @ApiProperty({
        description: 'Category name',
        example: 'Smartphones',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Parent category ID for hierarchical structure',
        example: '60f1b2b3c9b4a12345678900',
        type: String
    })
    @IsOptional()
    @IsString()
    parentId?: string;

    @ApiPropertyOptional({
        description: 'Sort order for category display',
        example: 10,
        type: Number,
        minimum: 0
    })
    @IsOptional()
    @IsNumber()
    sort?: number;
}