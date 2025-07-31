import { UsernameValidator } from "src/shared/validators/username.validator";
import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsEmail } from "class-validator";
export class RegisterShopDTO{
    @UsernameValidator()
    name: string;

    @IsEmail()
    email: string;
  
    @PasswordValidator()
    password: string;
}