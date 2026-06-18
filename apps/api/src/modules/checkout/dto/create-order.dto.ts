import { ShopOrderIdDTO } from "./checkout.dto";
import { IsArray, ValidateNested, IsString, IsObject } from "class-validator";
import { Type } from "class-transformer";

export class CreateOrderDTO {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ShopOrderIdDTO)
    shopOrderIds: ShopOrderIdDTO[];

    @IsString()
    cartId: string;

    @IsObject()
    userAddress: object;

    @IsObject()
    userPayment: object;
}
