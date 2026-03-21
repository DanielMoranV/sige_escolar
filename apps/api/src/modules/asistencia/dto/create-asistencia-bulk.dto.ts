import { IsString, IsNotEmpty, IsArray, IsEnum, IsUUID, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AsistenciaItemDto {
  @IsUUID()
  @IsNotEmpty()
  matriculaId: string;

  @IsEnum(['PRESENTE', 'TARDANZA', 'FALTA_INJUSTIFICADA', 'FALTA_JUSTIFICADA', 'LICENCIA'])
  @IsNotEmpty()
  estado: string;

  @IsString()
  @IsOptional()
  observacion?: string;

  @IsString()
  @IsOptional()
  horaLlegada?: string;
}

export class CreateAsistenciaBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsistenciaItemDto)
  items: AsistenciaItemDto[];
}
