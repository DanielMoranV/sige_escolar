import { Module } from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { AsistenciaController } from './asistencia.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AsistenciaService],
  controllers: [AsistenciaController],
  exports: [AsistenciaService],
})
export class AsistenciaModule {}
