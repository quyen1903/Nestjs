import { IsString, IsNotEmpty, IsInt } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetListDiscountDTO {
    @ApiProperty({ example: 'SUMMER2026' })
    @IsString()
    @IsNotEmpty()
    discountCode: string;

    @ApiProperty({ example: 'shop_123' })
    @IsString()
    @IsNotEmpty()
    discountShopId: string;

    @ApiProperty({ example: 10 })
    @IsInt()
    @IsNotEmpty()
    discountLimit: number;

    @ApiProperty({ example: 1 })
    @IsInt()
    @IsNotEmpty()
    discountPage: number;

}
