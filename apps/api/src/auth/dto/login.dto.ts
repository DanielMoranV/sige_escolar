import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
