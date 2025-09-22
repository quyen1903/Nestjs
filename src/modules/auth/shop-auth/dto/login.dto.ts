import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsEmail, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
export class LoginShopDTO{
    @IsEmail()
    @Transform(({value})=>value?.toLowerCase().trim())
    @ApiProperty({
        example: 'quinn@example.com',
        description: 'Shop email address'
    })
    email: string;
  
    @PasswordValidator()
    @IsString()
    @ApiProperty({
        example: 'SecurePass123!',
        description: 'Shop password'
    })
    password: string;

    @ApiProperty({
        example: 'SecurePass123!',
        description: 'deviceID'
    })
    @IsString()
    deviceId: string;
}