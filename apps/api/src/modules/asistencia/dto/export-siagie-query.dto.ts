import { IsUUID, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportSiagieQueryDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  mes: number;

  @IsUUID()
  @IsNotEmpty()
  anioEscolarId: string;

  @IsUUID()
  @IsOptional()
  seccionId?: string;
}
