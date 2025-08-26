import {
    IsNotEmpty,
    IsNumber,
    IsString,
    IsArray,
    IsObject,
    IsOptional,
    IsBoolean,
    IsInt
} from 'class-validator';

export class CreateSpuDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    intro?: string;

    @IsString()
    @IsNotEmpty()
    brandId: string;

    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsString()
    @IsOptional()
    afterSalesService?: string; 

    @IsString()
    @IsOptional()
    content?: string;

    @IsString()
    @IsOptional()
    attributeList?: string;

    @IsBoolean()
    @IsOptional()
    isMarketable?: boolean;

    @IsInt()
    @IsOptional()
    status?: number; // Made optional since it has default value 0

    // shopId is handled in the service, not in DTO
}

export class CreateSkuDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsNotEmpty()
    price: number; // Changed to number to match schema (Int type)

    @IsOptional()
    @IsNumber()
    num?: number;
    
    @IsString()
    @IsOptional()
    image?: string;
    
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsString()
    @IsOptional()
    brandName?: string;

    @IsString()
    @IsOptional()
    skuAttribute?: string; 
    
    @IsInt()
    @IsOptional()
    status?: number; 

    // Removed spuId - this will be set automatically when creating with SPU
    // Removed inventoryId - this should be handled separately
}

export class CreateBrandDTO {
    @IsString()
    @IsNotEmpty()
    name: string;
    
    @IsString()
    @IsOptional()
    image?: string; // Made optional since it has default value

    @IsString()
    @IsOptional()  
    initial?: string; // Made optional since it has default value

    @IsOptional()
    @IsNumber() // Fixed type - should be number, not string
    sort?: number;
}

export class CreateCategoryDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    parentId?: string;

    @IsOptional()
    @IsNumber()
    sort?: number; // Added sort field from schema
}
