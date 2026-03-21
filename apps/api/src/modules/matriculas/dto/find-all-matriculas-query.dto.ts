import { IsOptional, IsString, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllMatriculasQueryDto {
  @IsOptional()
  @IsUUID()
  anioEscolarId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsUUID()
  seccionId?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsUUID()
  estudianteId?: string;
}
