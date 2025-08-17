import { UsernameValidator } from "src/shared/validators/username.validator";
import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsEmail, IsString, IsOptional } from "class-validator";
export class RegisterShopDTO{
    @UsernameValidator()
    name: string;

    @IsEmail()
    email: string;
  
    @PasswordValidator()
    password: string;
}

export class ShopBusinessDTO {
    @IsString()
    businessName: string;

    @IsString()
    businessType: string;

    @IsString()
    taxId: string;

    @IsString()
    businessAddress: string;
}