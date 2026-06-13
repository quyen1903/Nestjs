import { IsString, IsNumber } from "class-validator";
export class InventoryDTO{
    @IsString()
    productId: string;

    @IsString()
    location: string;
    
    @IsNumber()
    stock: number;

    @IsString()
    shopBusinessId: string; // Add this field

}
