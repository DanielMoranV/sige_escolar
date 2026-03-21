import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateExoneracionDto {
  @IsUUID()
  @IsNotEmpty()
  matriculaId: string;

  @IsUUID()
  @IsNotEmpty()
  areaIeId: string;

  @IsString()
  @IsNotEmpty()
  tipo: string; // Ej: 'RELIGION', 'EDUCACION_FISICA'

  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsString()
  @IsOptional()
  documentoUrl?: string;

  @IsDateString()
  @IsNotEmpty()
  fechaSolicitud: string;
}
