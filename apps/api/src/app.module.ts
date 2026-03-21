import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { SchoolConfigModule } from './modules/config/school-config.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EstudiantesModule } from './modules/estudiantes/estudiantes.module';
import { MatriculasModule } from './modules/matriculas/matriculas.module';
import { AsistenciaModule } from './modules/asistencia/asistencia.module';
import { ApoderadosModule } from './modules/apoderados/apoderados.module';
import { ExoneracionesModule } from './modules/exoneraciones/exoneraciones.module';
import { NotasModule } from './modules/notas/notas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    AdminModule,
    SchoolConfigModule,
    DashboardModule,
    EstudiantesModule,
    MatriculasModule,
    AsistenciaModule,
    ApoderadosModule,
    ExoneracionesModule,
    NotasModule,
  ],
})
export class AppModule {}
