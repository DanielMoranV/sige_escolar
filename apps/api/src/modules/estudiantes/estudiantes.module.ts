import { Module } from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service';
import { EstudiantesController } from './estudiantes.controller';
import { DatabaseModule } from '../../database/database.module';
import { DniModule } from '../dni/dni.module';

@Module({
  imports: [DatabaseModule, DniModule],
  providers: [EstudiantesService],
  controllers: [EstudiantesController],
  exports: [EstudiantesService],
})
export class EstudiantesModule {}
