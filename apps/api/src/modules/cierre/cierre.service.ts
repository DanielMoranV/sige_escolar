import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PromocionService } from './promocion.service';
import { ExcelService } from '../siagie/excel.service';

@Injectable()
export class CierreService {
  private readonly logger = new Logger(CierreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promocionService: PromocionService,
    private readonly excelService: ExcelService
  ) {}

  async calcularCierre(slug: string, anioEscolarId: string, usuarioId: string) {
    // 1. Obtener todas las matrículas activas del año
    const matriculas = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT m.id, s.grado_id, g.nivel, g.numero
      FROM "${slug}".matriculas m
      JOIN "${slug}".secciones s ON m.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      WHERE m.anio_escolar_id = '${anioEscolarId}' AND m.estado = 'ACTIVA'
    `);

    // 2. Por cada matrícula, evaluar las notas finales de las áreas usando el Motor de Promoción
    for (const matricula of matriculas) {
      const { resultado, areasRecuperacion } = await this.promocionService.calcularResultadoMatricula(
        slug, 
        matricula.id, 
        matricula.nivel, 
        matricula.numero
      );

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "${slug}".cierre_anio 
          (matricula_id, resultado, promedios_areas, areas_recuperacion, calculado_en, calculado_por)
        VALUES 
          ('${matricula.id}', '${resultado}'::"${slug}".resultado_anio, '{}', '${JSON.stringify(areasRecuperacion)}', NOW(), '${usuarioId}')
        ON CONFLICT (matricula_id) DO UPDATE SET
          resultado = EXCLUDED.resultado,
          areas_recuperacion = EXCLUDED.areas_recuperacion,
          calculado_en = NOW(),
          calculado_por = EXCLUDED.calculado_por,
          es_caso_especial = false
      `);
    }

    return { message: 'Cierre de año calculado correctamente', total: matriculas.length };
  }

  async getResultado(slug: string, anioEscolarId: string, seccionId?: string) {
    let whereClause = `WHERE m.anio_escolar_id = '${anioEscolarId}' AND m.estado = 'ACTIVA'`;
    if (seccionId) {
      whereClause += ` AND m.seccion_id = '${seccionId}'`;
    }

    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT c.*, e.dni, e.apellido_paterno, e.apellido_materno, e.nombres, s.nombre as seccion_nombre, g.nombre as grado_nombre
      FROM "${slug}".cierre_anio c
      JOIN "${slug}".matriculas m ON c.matricula_id = m.id
      JOIN "${slug}".estudiantes e ON m.estudiante_id = e.id
      JOIN "${slug}".secciones s ON m.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      ${whereClause}
      ORDER BY g.orden, s.nombre, e.apellido_paterno, e.apellido_materno
    `);
  }

  async setCasoEspecial(slug: string, matriculaId: string, dto: { resultado: string, justificacion: string }) {
    await this.prisma.$executeRawUnsafe(`
      UPDATE "${slug}".cierre_anio
      SET resultado = '${dto.resultado}'::"${slug}".resultado_anio,
          es_caso_especial = true,
          justificacion_caso = '${dto.justificacion}'
      WHERE matricula_id = '${matriculaId}'
    `);
    return { message: 'Caso especial registrado' };
  }

  async exportExcel(slug: string, anioEscolarId: string): Promise<Buffer> {
    const data = await this.getResultado(slug, anioEscolarId);
    
    // Log SIAGIE export intent
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO "${slug}".siagie_sync_log (modulo, anio_escolar_id, estado, generado_en)
      VALUES ('NOTAS_FINALES', '${anioEscolarId}', 'GENERADO'::"${slug}".estado_sync, NOW())
    `);

    // We generate the Excel using ExcelService (we need to inject it)
    return this.excelService.generateCierreExcel(data);
  }
}
