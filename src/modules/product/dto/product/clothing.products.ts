import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ClothingDTO{
  @IsNotEmpty()
  @IsString()
  brand: string;

  @IsNotEmpty()
  @IsString()
  size: string;

  @IsNotEmpty()
  @IsString()
  material: string;
}
