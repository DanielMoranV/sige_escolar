import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { SchoolConfigModule } from './modules/config/school-config.module';
import { EstudiantesModule } from './modules/estudiantes/estudiantes.module';
import { MatriculasModule } from './modules/matriculas/matriculas.module';
import { AsistenciaModule } from './modules/asistencia/asistencia.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    AdminModule,
    SchoolConfigModule,
    EstudiantesModule,
    MatriculasModule,
    AsistenciaModule,
  ],
})
export class AppModule {}
