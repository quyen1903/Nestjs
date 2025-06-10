import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsNotEmpty, IsString } from "class-validator";
export class LoginUserManualDTO{
    @IsNotEmpty()
    @IsString()
    username: string;
  
    @PasswordValidator()
    password: string;
}