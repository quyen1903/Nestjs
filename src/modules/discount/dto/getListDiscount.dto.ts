import { IsString, IsNotEmpty, IsInt } from "class-validator";
export class GetListDiscountDTO {
    @IsString()
    @IsNotEmpty()
    discountCode: string;

    @IsString()
    @IsNotEmpty()
    discountShopId: string;

    @IsInt()
    @IsNotEmpty()
    discountLimit: number;

    @IsInt()
    @IsNotEmpty()
    discountPage: number;

}
