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
import { ReportesModule } from './modules/reportes/reportes.module';
import { CierreModule } from './modules/cierre/cierre.module';
import { SiagieModule } from './modules/siagie/siagie.module';
import { PortalModule } from './modules/portal/portal.module';
import { JobsModule } from './jobs/jobs.module';

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
    ReportesModule,
    CierreModule,
    SiagieModule,
    PortalModule,
    JobsModule,
  ],
})
export class AppModule {}
