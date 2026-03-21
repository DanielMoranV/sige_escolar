import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSuperadminDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  nombres: string;

  @IsString()
  @IsNotEmpty()
  apellidos: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
