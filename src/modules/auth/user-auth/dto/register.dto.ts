import { Sex } from "@prisma/client";
import { PasswordValidator } from "src/shared/validators/password.validator";
import { IsOptional, IsPhoneNumber, IsString, IsNotEmpty } from "class-validator";
export class RegisterUserDTO{

    @IsNotEmpty()
    @IsString()
    userName: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @PasswordValidator()
    password: string;

    @IsOptional()
    @IsString()
    avatar: string;

    @IsNotEmpty()
    @IsString()
    dateOfBirth: string;

    @IsPhoneNumber()
    @IsString()
    @IsOptional()
    phone: string;

    @IsNotEmpty()
    sex: Sex;
}