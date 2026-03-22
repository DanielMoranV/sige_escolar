import { Module } from '@nestjs/common';
import { DocentesService } from './docentes.service';
import { DocentesController } from './docentes.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [DocentesService],
  controllers: [DocentesController],
  exports: [DocentesService],
})
export class DocentesModule {}
