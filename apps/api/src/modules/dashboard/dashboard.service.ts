import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getLimaDateString } from '../../common/utils/date.util';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats(slug: string, anioEscolarId: string) {
    const today = getLimaDateString();

    // Count estudiantes from matriculas with state 'ACTIVA'
    const estudiantesResult = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count FROM "${slug}".matriculas 
       WHERE anio_escolar_id = '${anioEscolarId}' AND estado = 'ACTIVA'`
    );
    const totalEstudiantes = parseInt(estudiantesResult[0]?.count ?? '0', 10);

    // Count secciones
    const seccionesResult = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count FROM "${slug}".secciones 
       WHERE anio_escolar_id = '${anioEscolarId}' AND activa = true`
    );
    const totalSecciones = parseInt(seccionesResult[0]?.count ?? '0', 10);

    // Asistencia hoy
    const asistenciaHoyResult = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count FROM "${slug}".asistencia_diaria 
       WHERE fecha = '${today}' AND estado = 'PRESENTE'`
    );
    const asistenciaHoy = parseInt(asistenciaHoyResult[0]?.count ?? '0', 10);

    // Alertas activas (not attended)
    const alertasResult = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count FROM "${slug}".alertas_asistencia 
       WHERE atendida = false`
    );
    const alertasActivas = parseInt(alertasResult[0]?.count ?? '0', 10);

    return {
      totalEstudiantes,
      totalSecciones,
      asistenciaHoy,
      alertasActivas,
    };
  }
}
