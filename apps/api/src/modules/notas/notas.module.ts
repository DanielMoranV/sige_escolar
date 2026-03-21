import { Module } from '@nestjs/common';
import { NotasService } from './notas.service';
import { NotasController } from './notas.controller';
import { DatabaseModule } from '../../database/database.module';
import { SiagieModule } from '../siagie/siagie.module';

@Module({
  imports: [DatabaseModule, SiagieModule],
  controllers: [NotasController],
  providers: [NotasService],
  exports: [NotasService],
})
export class NotasModule {}
