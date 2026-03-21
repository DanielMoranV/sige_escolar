import { IsString, IsOptional, IsBoolean, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';

export enum Parentesco {
  PADRE = 'PADRE',
  MADRE = 'MADRE',
  ABUELO = 'ABUELO',
  ABUELA = 'ABUELA',
  HERMANO = 'HERMANO',
  HERMANA = 'HERMANA',
  TIO = 'TIO',
  TIA = 'TIA',
  APODERADO_LEGAL = 'APODERADO_LEGAL',
  OTRO = 'OTRO',
}

export class CreateApoderadoDto {
  @IsString()
  @IsOptional()
  dni?: string;

  @IsString()
  @IsNotEmpty()
  tipoDocumento: string;

  @IsString()
  @IsNotEmpty()
  numeroDocumento: string;

  @IsString()
  @IsNotEmpty()
  apellidoPaterno: string;

  @IsString()
  @IsOptional()
  apellidoMaterno?: string;

  @IsString()
  @IsNotEmpty()
  nombres: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  email?: string;

  // Campos para vinculación opcional con estudiante en la misma petición
  @IsUUID()
  @IsOptional()
  estudianteId?: string;

  @IsEnum(Parentesco)
  @IsOptional()
  parentesco?: Parentesco;

  @IsBoolean()
  @IsOptional()
  esApoderadoPrincipal?: boolean;

  @IsBoolean()
  @IsOptional()
  viveConEstudiante?: boolean;
}
