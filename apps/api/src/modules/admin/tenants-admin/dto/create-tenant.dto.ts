import {
  IsString,
  IsEmail,
  IsNumber,
  IsNotEmpty,
  IsIn,
  IsArray,
  ArrayMinSize,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateTenantDto {
  // Paso 1 - Datos básicos
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  nombreCorto: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['basico', 'profesional', 'enterprise'])
  plan: string;

  // Paso 2 - Datos MINEDU
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{7}$/, { message: 'Código modular debe tener exactamente 7 dígitos' })
  codigoModular: string;

  @IsString()
  @IsNotEmpty()
  nombreOficial: string;

  @IsString()
  @IsNotEmpty()
  dreCodigo: string;

  @IsString()
  @IsNotEmpty()
  dreNombre: string;

  @IsString()
  @IsNotEmpty()
  ugelCodigo: string;

  @IsString()
  @IsNotEmpty()
  ugelNombre: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['PRIVADA', 'PUBLICA', 'CONVENIO'])
  tipoGestion: string;

  // Paso 3 - Director
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8}$/, { message: 'DNI debe tener exactamente 8 dígitos' })
  directorDni: string;

  @IsString()
  @IsNotEmpty()
  directorNombres: string;

  @IsString()
  @IsNotEmpty()
  directorApellidos: string;

  @IsEmail()
  @IsNotEmpty()
  directorEmail: string;

  // Paso 4 - Niveles y año escolar
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['PRIMARIA', 'SECUNDARIA', 'INICIAL'], { each: true })
  niveles: string[];
  // Ej: ['PRIMARIA'] | ['SECUNDARIA'] | ['PRIMARIA', 'SECUNDARIA'] | ['INICIAL', 'PRIMARIA']

  @IsNumber()
  @Min(2020)
  @Max(2099)
  anioEscolar: number;

  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @IsDateString()
  @IsNotEmpty()
  fechaFin: string;

  @IsOptional()
  @IsString()
  @IsIn(['BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL'])
  regimenPrimaria?: string;
  // Requerido solo si niveles incluye PRIMARIA

  @IsOptional()
  @IsString()
  @IsIn(['BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL'])
  regimenSecundaria?: string;
  // Requerido solo si niveles incluye SECUNDARIA

  @IsOptional()
  @IsString()
  @IsIn(['BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL'])
  regimenInicial?: string;
  // Requerido solo si niveles incluye INICIAL
}
