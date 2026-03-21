import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getLibretaData(slug: string, matriculaId: string, periodoId: string) {
    // 1. Datos básicos del estudiante y matrícula
    const matricula = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT m.id, e.nombres, e.apellido_paterno, e.apellido_materno, e.dni,
             s.nombre as seccion_nombre, g.nombre as grado_nombre, g.nivel,
             t.nombre as colegio_nombre
      FROM "${slug}".matriculas m
      JOIN "${slug}".estudiantes e ON m.estudiante_id = e.id
      JOIN "${slug}".secciones s ON m.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      JOIN public.tenants t ON t.schema_name = '${slug}'
      WHERE m.id = '${matriculaId}'
    `);

    if (!matricula[0]) throw new NotFoundException('Matrícula no encontrada');

    // 2. Datos del periodo
    const periodo = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "${slug}".periodos WHERE id = '${periodoId}'
    `);

    // 3. Obtener todas las áreas y competencias con sus notas
    const areas = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        a.id as area_id, a.nombre_display as area_nombre, a.orden as area_orden,
        c.id as competencia_id, c.nombre_display as competencia_nombre, c.orden as competencia_orden,
        n.calificativo_literal, n.calificativo_numerico, n.conclusion_descriptiva
      FROM "${slug}".areas_ie a
      JOIN "${slug}".competencias_ie c ON c.area_ie_id = a.id
      LEFT JOIN "${slug}".notas_periodo n ON n.competencia_ie_id = c.id 
           AND n.matricula_id = '${matriculaId}' 
           AND n.periodo_id = '${periodoId}'
      WHERE a.anio_escolar_id = (SELECT anio_escolar_id FROM "${slug}".periodos WHERE id = '${periodoId}')
        AND a.nivel = '${matricula[0].nivel}'
        AND a.activa = true
      ORDER BY a.orden, c.orden
    `);

    // 4. Agrupar por áreas
    const areasAgrupadas = areas.reduce((acc: any[], curr: any) => {
      let area = acc.find(a => a.id === curr.area_id);
      if (!area) {
        area = {
          id: curr.area_id,
          nombre: curr.area_nombre,
          orden: curr.area_orden,
          competencias: []
        };
        acc.push(area);
      }
      area.competencias.push({
        id: curr.competencia_id,
        nombre: curr.competencia_nombre,
        orden: curr.competencia_orden,
        nota: curr.calificativo_literal || curr.calificativo_numerico || '—',
        conclusion: curr.conclusion_descriptiva || ''
      });
      return acc;
    }, []);

    // 5. Asistencia (resumen)
    const asistencia = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        COUNT(CASE WHEN estado = 'PRESENTE' THEN 1 END)::int as presentes,
        COUNT(CASE WHEN estado = 'TARDANZA' THEN 1 END)::int as tardanzas,
        COUNT(CASE WHEN estado = 'FALTA_JUSTIFICADA' THEN 1 END)::int as faltas_justificadas,
        COUNT(CASE WHEN estado = 'FALTA_INJUSTIFICADA' THEN 1 END)::int as faltas_injustificadas
      FROM "${slug}".asistencia_diaria
      WHERE matricula_id = '${matriculaId}'
        AND EXTRACT(MONTH FROM fecha) IN (
          SELECT EXTRACT(MONTH FROM fecha) 
          FROM "${slug}".calendario_escolar 
          WHERE anio_escolar_id = (SELECT anio_escolar_id FROM "${slug}".periodos WHERE id = '${periodoId}')
        )
    `);

    return {
      estudiante: matricula[0],
      periodo: periodo[0],
      areas: areasAgrupadas,
      asistencia: asistencia[0]
    };
  }

  async getSeccionRendimiento(slug: string, seccionId: string) {
    // Resumen de notas por área para la sección
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        a.nombre_display as area,
        COUNT(CASE WHEN n.calificativo_literal = 'AD' OR n.calificativo_numerico >= 18 THEN 1 END)::int as nivel_destacado,
        COUNT(CASE WHEN n.calificativo_literal = 'A' OR (n.calificativo_numerico >= 14 AND n.calificativo_numerico <= 17) THEN 1 END)::int as nivel_esperado,
        COUNT(CASE WHEN n.calificativo_literal = 'B' OR (n.calificativo_numerico >= 11 AND n.calificativo_numerico <= 13) THEN 1 END)::int as nivel_proceso,
        COUNT(CASE WHEN n.calificativo_literal = 'C' OR n.calificativo_numerico <= 10 THEN 1 END)::int as nivel_inicio
      FROM "${slug}".areas_ie a
      JOIN "${slug}".competencias_ie c ON c.area_ie_id = a.id
      JOIN "${slug}".notas_periodo n ON n.competencia_ie_id = c.id
      JOIN "${slug}".matriculas m ON n.matricula_id = m.id
      WHERE m.seccion_id = '${seccionId}'
      GROUP BY a.id, a.nombre_display, a.orden
      ORDER BY a.orden
    `);
  }
}
