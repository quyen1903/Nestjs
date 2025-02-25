import { IsNotEmpty, IsString } from 'class-validator';

export class ElectronicDTO{
  @IsNotEmpty()
  @IsString()
  manufacturer: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsString()
  color: string;
}
