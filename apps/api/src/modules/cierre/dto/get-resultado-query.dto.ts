import { IsUUID, IsOptional } from 'class-validator';

export class GetResultadoQueryDto {
  @IsUUID()
  @IsOptional()
  seccionId?: string;
}
