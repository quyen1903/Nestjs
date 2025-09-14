import { UsernameValidator } from "src/shared/validators/username.validator";
import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class RegisterShopDTO{
    @UsernameValidator()
    @ApiProperty({
        example: 'quinn nguyen',
        description: 'Shop name'
    })
    name: string;

    @IsEmail()
    @ApiProperty({
        example: 'quinn@example.com',
        description: 'Shop email address'
    })
    email: string;
  
    @PasswordValidator()
    @ApiProperty({ 
        example: 'SecurePass123!',
        description: 'User password'
    })
    password: string;
}