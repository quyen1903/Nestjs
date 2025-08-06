import { Sex } from "@prisma/client";
import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsOptional, IsPhoneNumber, IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class RegisterUserDTO{

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'quinn' })
    userName: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'quinn' })
    name: string;

    @IsNotEmpty()
    @PasswordValidator()
    @ApiProperty({ example: 'abc123' })
    password: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ example: 'quinn.png' })
    avatar: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: '2000-01-01T00:00:00Z', type: String, format: 'date-time' })
    dateOfBirth: string;

    @IsPhoneNumber()
    @IsString()
    @IsOptional()
    @ApiProperty({ example: '+84925020030' })
    phone: string;

    @IsNotEmpty()
    @ApiProperty({ example: 'FEMALE', enum: ['MALE', 'FEMALE'] })
    sex: Sex;
}