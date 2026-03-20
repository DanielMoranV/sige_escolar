import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsBoolean, Length, Matches } from 'class-validator';

export class CreateEstudianteDto {
  @IsString()
  @IsOptional()
  @Length(8, 8)
  dni?: string;

  @IsString()
  @IsNotEmpty()
  tipoDocumento: string; // DNI, CARNET_EXTRANJERIA, etc.

  @IsString()
  @IsNotEmpty()
  numeroDocumento: string;

  @IsString()
  @IsOptional()
  codigoSiagie?: string;

  @IsString()
  @IsNotEmpty()
  apellidoPaterno: string;

  @IsString()
  @IsOptional()
  apellidoMaterno?: string;

  @IsString()
  @IsNotEmpty()
  nombres: string;

  @IsDateString()
  @IsNotEmpty()
  fechaNacimiento: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1)
  @IsEnum(['M', 'F'])
  genero: string;

  @IsString()
  @IsOptional()
  @Length(6, 6)
  ubigeoNacimiento?: string;

  @IsString()
  @IsOptional()
  lenguaMaterna?: string;

  @IsString()
  @IsOptional()
  etnia?: string;

  @IsBoolean()
  @IsOptional()
  tieneDiscapacidad?: boolean;

  @IsString()
  @IsOptional()
  tipoDiscapacidad?: string;

  @IsString()
  @IsOptional()
  fotoUrl?: string;
}
