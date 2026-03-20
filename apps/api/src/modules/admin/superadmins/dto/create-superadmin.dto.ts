import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateSuperadminDto {
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
