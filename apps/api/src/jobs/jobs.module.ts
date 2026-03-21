import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AttendanceJob } from './attendance.job';
import { DatabaseModule } from '../database/database.module';
import { AsistenciaModule } from '../modules/asistencia/asistencia.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    AsistenciaModule,
  ],
  providers: [AttendanceJob],
})
export class JobsModule {}
