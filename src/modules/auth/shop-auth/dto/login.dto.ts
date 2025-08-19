import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsEmail, IsUUID } from "class-validator";
export class LoginShopDTO{
    @IsEmail()
    email: string;
  
    @PasswordValidator()
    password: string;

    @IsUUID()
    deviceId: string;
}

export class DeviceSessionDTO{

}