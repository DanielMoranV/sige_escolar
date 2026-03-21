import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CierreService {
  private readonly logger = new Logger(CierreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calcularCierre(slug: string, anioEscolarId: string, usuarioId: string) {
    // 1. Obtener todas las matrículas activas del año
    const matriculas = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT m.id, s.grado_id, g.nivel, g.numero
      FROM "${slug}".matriculas m
      JOIN "${slug}".secciones s ON m.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      WHERE m.anio_escolar_id = '${anioEscolarId}' AND m.estado = 'ACTIVA'
    `);

    // 2. Por cada matrícula, evaluar las notas finales de las áreas
    // Para simplificar en este prototipo, simularemos el resultado basado en una regla básica
    // En producción se traería la grilla anual completa y se contaría cuántas competencias tienen 'C'
    
    for (const matricula of matriculas) {
      let resultado = 'PROMOVIDO'; // Default
      
      // Regla de exención
      if (matricula.nivel === 'INICIAL' || (matricula.nivel === 'PRIMARIA' && matricula.numero === 1)) {
        resultado = 'PROMOVIDO';
      } else {
        // Obtenemos un conteo simulado de competencias desaprobadas (C o < 11)
        const notasFinales = await this.prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(*) as desaprobadas
          FROM "${slug}".notas_periodo n
          WHERE n.matricula_id = '${matricula.id}'
          AND (n.calificativo_literal = 'C' OR n.calificativo_numerico <= 10)
        `);
        
        const desaprobadas = parseInt(notasFinales[0]?.desaprobadas || '0', 10);
        
        // Simulación de la regla: 
        // 0-3 desaprobadas (competencias) -> PROMOVIDO
        // 4-8 desaprobadas -> RECUPERACION
        // > 8 desaprobadas -> PERMANECE
        if (desaprobadas > 8) {
          resultado = 'PERMANECE';
        } else if (desaprobadas >= 4) {
          resultado = 'RECUPERACION';
        }
      }

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "${slug}".cierre_anio 
          (matricula_id, resultado, promedios_areas, areas_recuperacion, calculado_en, calculado_por)
        VALUES 
          ('${matricula.id}', '${resultado}'::"${slug}".resultado_anio, '{}', '[]', NOW(), '${usuarioId}')
        ON CONFLICT (matricula_id) DO UPDATE SET
          resultado = EXCLUDED.resultado,
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

  async exportExcel(slug: string, anioEscolarId: string) {
    const data = await this.getResultado(slug, anioEscolarId);
    
    // Log SIAGIE export intent
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO "${slug}".siagie_sync_log (modulo, anio_escolar_id, estado, exportado_en, archivo_nombre)
      VALUES ('NOTAS_FINALES'::"${slug}".modulo_siagie, '${anioEscolarId}', 'EXPORTADO'::"${slug}".estado_sync, NOW(), 'Cierre_Anual_${anioEscolarId}.xlsx')
    `);

    return {
      message: 'Exportación generada',
      timestamp: new Date().toISOString(),
      data
    };
  }
}
