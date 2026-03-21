import { Module } from '@nestjs/common';
import { ExoneracionesService } from './exoneraciones.service';
import { ExoneracionesController } from './exoneraciones.controller';

@Module({
  controllers: [ExoneracionesController],
  providers: [ExoneracionesService],
})
export class ExoneracionesModule {}
