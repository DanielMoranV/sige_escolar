import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
      const { resultado, areasRecuperacion, promediosAreas } = await this.promocionService.calcularResultadoMatricula(
        slug,
        matricula.id,
        matricula.nivel,
        matricula.numero,
      );

      const promediosJson = JSON.stringify(promediosAreas).replace(/'/g, "''");
      const recuperacionJson = JSON.stringify(areasRecuperacion).replace(/'/g, "''");

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "${slug}".cierre_anio
          (matricula_id, resultado, promedios_areas, areas_recuperacion, calculado_en, calculado_por)
        VALUES
          ('${matricula.id}', '${resultado}'::"${slug}".resultado_anio, '${promediosJson}'::jsonb, '${recuperacionJson}'::jsonb, NOW(), '${usuarioId}')
        ON CONFLICT (matricula_id) DO UPDATE SET
          resultado = EXCLUDED.resultado,
          promedios_areas = EXCLUDED.promedios_areas,
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
    const justificacion = dto.justificacion.replace(/'/g, "''");
    await this.prisma.$executeRawUnsafe(`
      UPDATE "${slug}".cierre_anio
      SET resultado = '${dto.resultado}'::"${slug}".resultado_anio,
          es_caso_especial = true,
          justificacion_caso = '${justificacion}'
      WHERE matricula_id = '${matriculaId}'
    `);
    return { message: 'Caso especial registrado' };
  }

  // ─── Recuperación ───────────────────────────────────────────────────────────

  /**
   * Retorna los estudiantes en programa de recuperación con sus áreas deficitarias,
   * las competencias de cada área y las notas de recuperación ya ingresadas (si existen).
   */
  async getRecuperacion(slug: string, anioEscolarId: string, seccionId?: string) {
    let whereClause = `WHERE ca.resultado = 'RECUPERACION'::"${slug}".resultado_anio
      AND m.anio_escolar_id = '${anioEscolarId}' AND m.estado = 'ACTIVA'`;
    if (seccionId) {
      whereClause += ` AND m.seccion_id = '${seccionId}'`;
    }

    const estudiantes = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        ca.matricula_id,
        ca.areas_recuperacion,
        ca.resultado_recuperacion,
        e.dni, e.apellido_paterno, e.apellido_materno, e.nombres,
        s.nombre AS seccion_nombre,
        g.nombre AS grado_nombre, g.nivel AS nivel
      FROM "${slug}".cierre_anio ca
      JOIN "${slug}".matriculas m ON ca.matricula_id = m.id
      JOIN "${slug}".estudiantes e ON m.estudiante_id = e.id
      JOIN "${slug}".secciones s ON m.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      ${whereClause}
      ORDER BY g.orden, s.nombre, e.apellido_paterno, e.apellido_materno
    `);

    if (estudiantes.length === 0) return [];

    // Para cada estudiante, obtener las competencias de sus áreas de recuperación
    // y las notas de recuperación ya ingresadas
    const matriculaIds = estudiantes.map(e => `'${e.matricula_id}'`).join(',');

    const notasRecup = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT rm.matricula_id, rm.area_ie_id, rm.notas_recuperacion, rm.resultado_area, a.nombre_display AS area_nombre
      FROM "${slug}".recuperacion_matricula rm
      JOIN "${slug}".areas_ie a ON rm.area_ie_id = a.id
      WHERE rm.matricula_id IN (${matriculaIds})
    `);

    const notasMap = new Map<string, Map<string, any>>();
    for (const n of notasRecup) {
      const mId = String(n.matricula_id);
      if (!notasMap.has(mId)) notasMap.set(mId, new Map());
      notasMap.get(mId)!.set(String(n.area_ie_id), n);
    }

    // Obtener las áreas IE con sus competencias para los nombres de áreas de recuperación
    const areasConCompetencias = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT a.id AS area_id, a.nombre_display AS area_nombre, c.id AS competencia_id, c.nombre_display AS competencia_nombre, c.orden
      FROM "${slug}".areas_ie a
      JOIN "${slug}".competencias_ie c ON c.area_ie_id = a.id AND c.activa = true
      ORDER BY a.nombre_display, c.orden
    `);

    const areasMap = new Map<string, { id: string; nombre: string; competencias: any[] }>();
    for (const row of areasConCompetencias) {
      const aId = String(row.area_id);
      if (!areasMap.has(aId)) {
        areasMap.set(aId, { id: aId, nombre: row.area_nombre, competencias: [] });
      }
      areasMap.get(aId)!.competencias.push({
        id: String(row.competencia_id),
        nombre: row.competencia_nombre,
        orden: row.orden,
      });
    }

    // Buscar el area_ie_id por nombre (areas_recuperacion es array de nombres)
    const areasByNombre = new Map<string, typeof areasMap extends Map<any, infer V> ? V : never>();
    for (const area of areasMap.values()) {
      areasByNombre.set(area.nombre, area);
    }

    return estudiantes.map(est => {
      const mId = String(est.matricula_id);
      const areasNombres: string[] = est.areas_recuperacion ?? [];
      const notasDelEst = notasMap.get(mId);

      const areas = areasNombres.map(nombre => {
        const areaDef = areasByNombre.get(nombre);
        if (!areaDef) return null;
        const notaArea = notasDelEst?.get(areaDef.id);
        return {
          area_id: areaDef.id,
          area_nombre: nombre,
          resultado_area: notaArea?.resultado_area ?? null,
          competencias: areaDef.competencias.map(c => ({
            competencia_id: c.id,
            nombre: c.nombre,
            orden: c.orden,
            literal: notaArea?.notas_recuperacion?.[c.id]?.literal ?? null,
            numerico: notaArea?.notas_recuperacion?.[c.id]?.numerico ?? null,
          })),
        };
      }).filter(Boolean);

      return {
        matricula_id: mId,
        dni: est.dni,
        apellido_paterno: est.apellido_paterno,
        apellido_materno: est.apellido_materno,
        nombres: est.nombres,
        grado_nombre: est.grado_nombre,
        seccion_nombre: est.seccion_nombre,
        nivel: est.nivel,
        resultado_recuperacion: est.resultado_recuperacion ?? null,
        areas,
      };
    });
  }

  /**
   * Guarda/actualiza las notas de recuperación de un estudiante para un área específica.
   * notas: { [competenciaIeId]: { literal: string|null, numerico: number|null } }
   */
  async saveNotasRecuperacion(
    slug: string,
    matriculaId: string,
    areaId: string,
    notas: Record<string, { literal: string | null; numerico: number | null }>,
  ) {
    const notasJson = JSON.stringify(notas).replace(/'/g, "''");
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO "${slug}".recuperacion_matricula (matricula_id, area_ie_id, notas_recuperacion)
      VALUES ('${matriculaId}', '${areaId}', '${notasJson}'::jsonb)
      ON CONFLICT (matricula_id, area_ie_id) DO UPDATE SET
        notas_recuperacion = EXCLUDED.notas_recuperacion,
        resultado_area = NULL
    `);
    return { message: 'Notas de recuperación guardadas' };
  }

  /**
   * Recalcula el resultado post-recuperación de un estudiante.
   * Evalúa cada área de recuperación con las notas ingresadas y determina
   * si aprueba (PROMOVIDO) o repite (PERMANECE).
   */
  async recalcularPostRecuperacion(slug: string, matriculaId: string) {
    // 1. Obtener el registro de cierre_anio
    const cierre = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT ca.areas_recuperacion, m.seccion_id, g.nivel, g.numero
      FROM "${slug}".cierre_anio ca
      JOIN "${slug}".matriculas m ON ca.matricula_id = m.id
      JOIN "${slug}".secciones s ON m.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      WHERE ca.matricula_id = '${matriculaId}'
        AND ca.resultado = 'RECUPERACION'::"${slug}".resultado_anio
    `);

    if (!cierre.length) {
      throw new BadRequestException('El estudiante no está en situación de RECUPERACION');
    }

    const { nivel, numero: gradoNumero, areas_recuperacion: areasNombres } = cierre[0];
    const esGradoEstricto = gradoNumero === 2 || gradoNumero === 5;

    // 2. Obtener las notas de recuperación ingresadas
    const notasRecup = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT rm.area_ie_id, rm.notas_recuperacion, a.nombre_display AS area_nombre
      FROM "${slug}".recuperacion_matricula rm
      JOIN "${slug}".areas_ie a ON rm.area_ie_id = a.id
      WHERE rm.matricula_id = '${matriculaId}'
    `);

    if (!notasRecup.length) {
      throw new BadRequestException('No hay notas de recuperación ingresadas para este estudiante');
    }

    // 3. Evaluar cada área de recuperación
    let areasAunDeficitarias = 0;
    const resultadosPorArea: Record<string, string> = {};

    for (const notaArea of notasRecup) {
      const notas = notaArea.notas_recuperacion as Record<string, { literal: string | null; numerico: number | null }>;
      if (!notas) continue;

      // Obtener todas las competencias del área para el conteo
      const competencias = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT id FROM "${slug}".competencias_ie WHERE area_ie_id = '${notaArea.area_ie_id}' AND activa = true
      `);

      const totalComp = competencias.length;
      if (totalComp === 0) continue;

      // Contar competencias deficientes con las notas de recuperación
      let compDeficientes = 0;
      for (const comp of competencias) {
        const nota = notas[String(comp.id)];
        if (!nota) continue;
        const deficiente = this.esCompDeficienteRecup(nivel, esGradoEstricto, nota.literal, nota.numerico);
        if (deficiente) compDeficientes++;
      }

      const areaAprobada = compDeficientes < totalComp / 2;
      resultadosPorArea[String(notaArea.area_ie_id)] = areaAprobada ? 'APROBADO' : 'DESAPROBADO';
      if (!areaAprobada) areasAunDeficitarias++;
    }

    // 4. Actualizar resultado_area en recuperacion_matricula
    for (const [areaId, resultadoArea] of Object.entries(resultadosPorArea)) {
      await this.prisma.$executeRawUnsafe(`
        UPDATE "${slug}".recuperacion_matricula
        SET resultado_area = '${resultadoArea}'
        WHERE matricula_id = '${matriculaId}' AND area_ie_id = '${areaId}'
      `);
    }

    // 5. Determinar resultado final post-recuperación
    // Si supera todas sus áreas de recuperación → PROMOVIDO; si no → PERMANECE
    const resultadoFinal = areasAunDeficitarias === 0 ? 'PROMOVIDO' : 'PERMANECE';

    await this.prisma.$executeRawUnsafe(`
      UPDATE "${slug}".cierre_anio
      SET resultado_recuperacion = '${resultadoFinal}'::"${slug}".resultado_anio
      WHERE matricula_id = '${matriculaId}'
    `);

    return {
      resultado_recuperacion: resultadoFinal,
      areas_evaluadas: resultadosPorArea,
      areas_aun_deficitarias: areasAunDeficitarias,
    };
  }

  private esCompDeficienteRecup(
    nivel: string,
    esEstricto: boolean,
    literal: string | null,
    numerico: number | null,
  ): boolean {
    if (nivel === 'PRIMARIA') {
      if (!literal) return false;
      return esEstricto ? literal === 'B' || literal === 'C' : literal === 'C';
    } else {
      if (numerico === null) return false;
      return esEstricto ? numerico < 14 : numerico <= 10;
    }
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
