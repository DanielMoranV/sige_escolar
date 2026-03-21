import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SiagieService {
  constructor(private readonly prisma: PrismaService) {}

  async getSyncLog(slug: string, anioEscolarId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT l.*, u.nombres as generado_por_nombre
      FROM "${slug}".siagie_sync_log l
      LEFT JOIN public.usuarios u ON l.generado_por = u.id
      WHERE l.anio_escolar_id = '${anioEscolarId}'
      ORDER BY l.created_at DESC
    `);
  }

  async confirmarSync(slug: string, id: string, dto: { estado: string, observacion?: string }, usuarioId: string) {
    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      UPDATE "${slug}".siagie_sync_log
      SET estado = '${dto.estado}'::"${slug}".estado_sync,
          notas = ${dto.observacion ? `'${dto.observacion.replace(/'/g, "''")}'` : 'NULL'},
          enviado_en = NOW()
      WHERE id = '${id}'
      RETURNING *
    `);

    if (!result[0]) throw new NotFoundException('Registro de sincronización no encontrado');
    return result[0];
  }
}
