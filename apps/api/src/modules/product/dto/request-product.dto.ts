import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSpuDTO } from './create-spu.dto';
import { CreateSkuDTO } from './create-sku.dto';
import { CreateCategoryDTO } from './create-category.dto';
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


// export class CreateCategoryDTO {
//     @ApiProperty({
//         description: 'Category name',
//         example: 'Smartphones',
//         type: String
//     })
//     @IsString()
//     @IsNotEmpty()
//     name: string;
// }
