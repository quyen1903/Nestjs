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
    brandId: string;

    @IsString()
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
    isMarketable?: boolean;

    @IsInt()
    status: number;

    @IsString()
    @IsNotEmpty()
    shopBusinessId: string; 
}


export class CreateSkuDTO {

    @IsString()
    @IsNotEmpty()
    spuId: string; 
    
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsOptional()
    @IsNumber()
    num?: number;
    
    @IsString()
    @IsOptional()
    image?: string;
    
    @IsString()
    @IsOptional()
    images?: string[];

    @IsString()
    @IsOptional()
    categoryId?: string;
    
    @IsString()
    categoryName?: string;
    
    @IsString()
    @IsOptional()
    brandName?: string;

    @IsString()
    @IsOptional()
    skuAttribute?: string; 
    
    @IsNumber()
    status?: number; 

    @IsString()
    @IsOptional()
    inventoryId?: string; 
}
export class CreateBrandDTO {
    
    @IsString()
    name: string;
    
    @IsString()
    image: string;

    @IsString()
    initial: string;

    @IsOptional()
    @IsString()
    sort?: number
}

export class CreateCategoryDTO {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    parentId?: string
}
