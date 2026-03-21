import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { AsistenciaService } from '../modules/asistencia/asistencia.service';

@Injectable()
export class AttendanceJob {
  private readonly logger = new Logger(AttendanceJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asistenciaService: AsistenciaService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyMaintenance() {
    this.logger.log('Starting attendance maintenance job...');
    
    // 1. Obtener todos los tenants
    const tenants = await this.prisma.tenant.findMany({ where: { activo: true } });

    for (const tenant of tenants) {
      try {
        const slug = tenant.schema_name;
        
        // 2. Vencer justificaciones que pasaron el plazo
        const today = new Date().toISOString().split('T')[0];
        await this.prisma.$executeRawUnsafe(`
          UPDATE "${slug}".justificaciones
          SET estado = 'VENCIDA'::"${slug}".estado_justificacion
          WHERE estado = 'PENDIENTE' AND plazo_vencimiento < '${today}'
        `);

        // 3. Recalcular alertas de asistencia para el año activo
        const anioActivo = await this.prisma.$queryRawUnsafe<any[]>(`
          SELECT id FROM "${slug}".anio_escolar_config WHERE activo = true LIMIT 1
        `);

        if (anioActivo[0]) {
          await this.asistenciaService.calcularAlertas(slug, anioActivo[0].id);
        }

      } catch (error) {
        this.logger.error(`Error processing tenant ${tenant.slug}`, error);
      }
    }

    this.logger.log('Attendance maintenance job finished.');
  }
}
