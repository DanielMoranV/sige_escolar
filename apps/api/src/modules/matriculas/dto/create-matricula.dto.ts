import { IsString, IsNotEmpty, IsUUID, IsDateString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';

export class CreateMatriculaDto {
  @IsUUID()
  @IsNotEmpty()
  anioEscolarId: string;

  @IsUUID()
  @IsNotEmpty()
  estudianteId: string;

  @IsUUID()
  @IsNotEmpty()
  seccionId: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['CONTINUIDAD', 'INGRESO', 'REINCORPORACION', 'TRASLADO'])
  tipoMatricula: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['PROMOVIDO', 'REPITE', 'INGRESANTE'])
  condicionMatricula: string;

  @IsDateString()
  @IsNotEmpty()
  fechaMatricula: string;

  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @IsString()
  @IsOptional()
  ieProcedencia?: string;

  @IsString()
  @IsOptional()
  codigoModularProcedencia?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  repeticionesEnNivel?: number;
}
