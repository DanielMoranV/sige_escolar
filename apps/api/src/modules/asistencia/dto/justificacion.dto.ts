import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum } from 'class-validator';

export class CreateJustificacionDto {
  @IsUUID()
  @IsNotEmpty()
  asistenciaId: string;

  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsString()
  @IsOptional()
  documentoUrl?: string;
}

export class ReviewJustificacionDto {
  @IsEnum(['APROBADA', 'RECHAZADA'])
  @IsNotEmpty()
  estado: string;

  @IsString()
  @IsOptional()
  observacion?: string;
}
