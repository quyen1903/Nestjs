import { ApiProperty } from "@nestjs/swagger";
import { 
    IsNotEmpty, 
    IsNumber, 
    IsOptional, 
    IsString, 
    IsUUID 
} from "class-validator";

export class CreateCategoryDTO {
    @ApiProperty({
        description: 'Category name',
        example: 'Smartphones',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsUUID()
    parentId?: string;

    @IsOptional()
    @IsNumber()
    sort?: number;
}