import { IsUUID, IsNotEmpty } from 'class-validator';

export class GetGrillaQueryDto {
  @IsUUID()
  @IsNotEmpty()
  seccionId: string;

  @IsUUID()
  @IsNotEmpty()
  periodoId: string;

  @IsUUID()
  @IsNotEmpty()
  areaId: string;
}

export class ExportNotasQueryDto {
  @IsUUID()
  @IsNotEmpty()
  seccionId: string;

  @IsUUID()
  @IsNotEmpty()
  periodoId: string;
}
