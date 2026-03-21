import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PortalService {
  private readonly logger = new Logger(PortalService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getHijoMatricula(slug: string, usuarioId: string) {
    // Busca la matrícula activa del hijo del apoderado
    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT m.id as matricula_id, e.id as estudiante_id, e.nombres, e.apellido_paterno, e.apellido_materno,
             s.nombre as seccion_nombre, g.nombre as grado_nombre, m.anio_escolar_id
      FROM "${slug}".apoderados ap
      JOIN "${slug}".estudiante_apoderado ea ON ea.apoderado_id = ap.id
      JOIN "${slug}".estudiantes e ON e.id = ea.estudiante_id
      JOIN "${slug}".matriculas m ON m.estudiante_id = e.id
      JOIN "${slug}".secciones s ON m.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      WHERE ap.usuario_id = '${usuarioId}' AND m.estado = 'ACTIVA'
      LIMIT 1
    `);

    if (!result[0]) throw new NotFoundException('No se encontró estudiante asociado o matrícula activa.');
    return result[0];
  }

  async getHijoResumen(slug: string, usuarioId: string) {
    const hijo = await this.getHijoMatricula(slug, usuarioId);
    return hijo;
  }

  async getNotas(slug: string, usuarioId: string, periodoId: string) {
    const hijo = await this.getHijoMatricula(slug, usuarioId);

    const notas = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        a.nombre_display as area, 
        c.nombre_display as competencia,
        n.calificativo_literal, 
        n.calificativo_numerico,
        n.conclusion_descriptiva
      FROM "${slug}".notas_periodo n
      JOIN "${slug}".competencias_ie c ON n.competencia_ie_id = c.id
      JOIN "${slug}".areas_ie a ON c.area_ie_id = a.id
      WHERE n.matricula_id = '${hijo.matricula_id}'
        AND n.periodo_id = '${periodoId}'
      ORDER BY a.orden, c.orden
    `);

    return {
      estudiante: hijo,
      notas
    };
  }

  async getAsistencia(slug: string, usuarioId: string) {
    const hijo = await this.getHijoMatricula(slug, usuarioId);

    const asistencia = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT fecha, estado, observacion
      FROM "${slug}".asistencia_diaria
      WHERE matricula_id = '${hijo.matricula_id}'
      ORDER BY fecha DESC
      LIMIT 30
    `);

    // Resumen mensual
    const resumen = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        COUNT(CASE WHEN estado IN ('PRESENTE', 'TARDANZA', 'LICENCIA') THEN 1 END)::int as asistencias,
        COUNT(CASE WHEN estado = 'FALTA_JUSTIFICADA' THEN 1 END)::int as faltas_justificadas,
        COUNT(CASE WHEN estado = 'FALTA_INJUSTIFICADA' THEN 1 END)::int as faltas_injustificadas
      FROM "${slug}".asistencia_diaria
      WHERE matricula_id = '${hijo.matricula_id}' 
        AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
    `);

    return {
      estudiante: hijo,
      resumenMensual: resumen[0],
      historialReciente: asistencia
    };
  }

  async getLibretasDisponibles(slug: string, usuarioId: string) {
    const hijo = await this.getHijoMatricula(slug, usuarioId);

    const libretas = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT p.id as periodo_id, p.nombre as periodo_nombre
      FROM "${slug}".informe_progreso_entrega i
      JOIN "${slug}".periodos p ON i.periodo_id = p.id
      WHERE i.matricula_id = '${hijo.matricula_id}'
    `);

    return {
      estudiante: hijo,
      libretas
    };
  }
}
