import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { PasswordValidator } from 'src/shared/validators/password.validator';
export class ResetPasswordDTO {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @PasswordValidator()
  password: string;
}