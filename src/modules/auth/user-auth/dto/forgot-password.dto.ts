import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDTO {
    @ApiProperty({ example: 'quinn@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
