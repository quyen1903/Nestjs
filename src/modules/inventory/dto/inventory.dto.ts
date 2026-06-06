import { IsString, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class InventoryDTO{
    @ApiProperty({ example: 'sku_123' })
    @IsString()
    productId: string;

    @ApiProperty({ example: '17A Cong Hoa, Tan Binh' })
    @IsString()
    location: string;
    
    @ApiProperty({ example: 100 })
    @IsNumber()
    stock: number;

    @ApiProperty({ example: 'shop_123' })
    @IsString()
    shopBusinessId: string; // Add this field

}
