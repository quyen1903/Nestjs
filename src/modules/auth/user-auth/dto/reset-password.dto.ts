import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PasswordValidator } from 'src/shared/validators/password.validator';
export class ResetPasswordDTO {
  @ApiProperty({ example: 'reset-token' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsNotEmpty()
  @PasswordValidator()
  password: string;
}
