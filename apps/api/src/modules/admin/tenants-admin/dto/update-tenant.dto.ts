import {
  IsString,
  IsEmail,
  IsNumber,
  IsIn,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nombreCorto?: string;

  @IsOptional()
  @IsString()
  @IsIn(['basico', 'profesional', 'enterprise'])
  plan?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{7}$/, { message: 'Código modular debe tener exactamente 7 dígitos' })
  codigoModular?: string;

  @IsOptional()
  @IsString()
  nombreOficial?: string;

  @IsOptional()
  @IsString()
  dreCodigo?: string;

  @IsOptional()
  @IsString()
  dreNombre?: string;

  @IsOptional()
  @IsString()
  ugelCodigo?: string;

  @IsOptional()
  @IsString()
  ugelNombre?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PRIVADA', 'PUBLICA', 'CONVENIO'])
  tipoGestion?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'DNI debe tener exactamente 8 dígitos' })
  directorDni?: string;

  @IsOptional()
  @IsString()
  directorNombres?: string;

  @IsOptional()
  @IsString()
  directorApellidos?: string;

  @IsOptional()
  @IsEmail()
  directorEmail?: string;

  @IsOptional()
  @IsNumber()
  @Min(2020)
  @Max(2099)
  anioEscolar?: number;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsArray()
  @IsIn(['PRIMARIA', 'SECUNDARIA', 'INICIAL'], { each: true })
  niveles?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL'])
  regimenPrimaria?: string;

  @IsOptional()
  @IsString()
  @IsIn(['BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL'])
  regimenSecundaria?: string;

  @IsOptional()
  @IsString()
  @IsIn(['BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL'])
  regimenInicial?: string;
}
