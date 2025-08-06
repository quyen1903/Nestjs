import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class LoginUserManualDTO{
    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'quinn' })
    username: string;
  
    @PasswordValidator()
    @ApiProperty({ example: 'abc123' }) 
    password: string;
}