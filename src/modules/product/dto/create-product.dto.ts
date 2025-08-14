import {
    IsNotEmpty,
    IsNumber,
    IsString,
    IsEnum,
    ValidateNested,
    IsObject,
    IsOptional,
    IsBoolean
} from 'class-validator';



export class CreateSpuDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    intro?: string;

    @IsOptional()
    @IsString()
    brandId?: string;

    @IsString()
    categoryId?: string;

    @IsString()
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

    @IsOptional()
    @IsString()
    brandId?: string;
    
    @IsString()
    @IsOptional()
    brandName?: string;

    @IsString()
    @IsOptional()
    skuAttribute?: string; 
    
    @IsString()
    @IsNumber()
    status?: number; 

    @IsString()
    @IsOptional()
    inventoryId?: string; 
}
