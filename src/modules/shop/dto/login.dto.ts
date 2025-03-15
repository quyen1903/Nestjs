import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsEmail } from "class-validator";
export class LoginShopDTO{
    @IsEmail()
    email: string;
  
    @PasswordValidator()
    password: string;
}