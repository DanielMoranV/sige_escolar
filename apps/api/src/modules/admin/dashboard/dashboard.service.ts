import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    // Counts from public schema
    const [totalColegiosActivos, totalColegiosInactivos, totalUsuarios] = await Promise.all([
      this.prisma.tenant.count({ where: { activo: true } }),
      this.prisma.tenant.count({ where: { activo: false } }),
      this.prisma.usuario.count({ where: { deleted_at: null } }),
    ]);

    // Get all tenant slugs to query their student counts
    const tenants = await this.prisma.tenant.findMany({
      where: { activo: true },
      select: { slug: true },
    });

    // Sum estudiantes across all active tenant schemas
    let totalEstudiantes = 0;
    for (const tenant of tenants) {
      try {
        const result = await this.prisma.$queryRawUnsafe<Array<{ count: string }>>(
          `SELECT COUNT(*) as count FROM "${tenant.slug}".estudiantes WHERE deleted_at IS NULL`,
        );
        totalEstudiantes += parseInt(result[0]?.count ?? '0', 10);
      } catch {
        // Schema may not have the table yet — skip gracefully
        this.logger.warn(`Could not query estudiantes for tenant: ${tenant.slug}`);
      }
    }

    // Last access — most recently updated user
    const ultimoAccesoUser = await this.prisma.usuario.findFirst({
      where: { deleted_at: null },
      orderBy: { updated_at: 'desc' },
      select: { updated_at: true },
    });

    return {
      totalColegiosActivos,
      totalColegiosInactivos,
      totalEstudiantes,
      totalUsuarios,
      ultimoAcceso: ultimoAccesoUser?.updated_at ?? null,
    };
  }
}
