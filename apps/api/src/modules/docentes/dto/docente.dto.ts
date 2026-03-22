import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateDocenteDto {
  @IsString()
  @IsNotEmpty()
  @Length(8, 8)
  dni: string;

  @IsString()
  @IsNotEmpty()
  nombres: string;

  @IsString()
  @IsNotEmpty()
  apellidos: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  especialidad?: string;
}

export class UpdateDocenteDto {
  @IsString()
  @IsOptional()
  nombres?: string;

  @IsString()
  @IsOptional()
  apellidos?: string;

  @IsString()
  @IsOptional()
  especialidad?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class AsignarDto {
  @IsUUID()
  @IsNotEmpty()
  docenteId: string;

  @IsUUID()
  @IsNotEmpty()
  areaIeId: string;

  @IsUUID()
  @IsNotEmpty()
  seccionId: string;

  @IsBoolean()
  @IsOptional()
  esTutor?: boolean;
}
