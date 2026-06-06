import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Electronics' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'category_parent_123' })
    @IsOptional()
    @IsString()
    parentId?: string;
}
