import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum CalificativoLiteral {
  AD = 'AD',
  A = 'A',
  B = 'B',
  C = 'C',
  EXO = 'EXO',
  NR = 'NR',
}

export class NotaItemDto {
  @IsUUID()
  @IsNotEmpty()
  matriculaId: string;

  @IsUUID()
  @IsNotEmpty()
  competenciaIeId: string;

  @IsEnum(CalificativoLiteral)
  @IsOptional()
  calificativoLiteral?: CalificativoLiteral;

  @IsInt()
  @Min(0)
  @Max(20)
  @IsOptional()
  calificativoNumerico?: number;

  @IsString()
  @IsOptional()
  conclusionDescriptiva?: string;
}

export class SaveGrillaDto {
  @IsUUID()
  @IsNotEmpty()
  periodoId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotaItemDto)
  notas: NotaItemDto[];
}
