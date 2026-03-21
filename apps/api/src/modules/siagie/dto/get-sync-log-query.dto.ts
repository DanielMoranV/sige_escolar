import { IsUUID, IsNotEmpty } from 'class-validator';

export class GetSyncLogQueryDto {
  @IsUUID()
  @IsNotEmpty()
  anioEscolarId: string;
}
