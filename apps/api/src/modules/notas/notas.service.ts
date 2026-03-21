import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ExcelService } from '../siagie/excel.service';
import { SaveGrillaDto } from './dto/save-grilla.dto';

@Injectable()
export class NotasService {
  private readonly logger = new Logger(NotasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelService
  ) {}

  async getGrilla(slug: string, seccionId: string, periodoId: string, areaId: string) {
    // 1. Obtener competencias del área
    const competencias = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT id, nombre_display, orden 
      FROM "${slug}".competencias_ie 
      WHERE area_ie_id = '${areaId}' AND activa = true 
      ORDER BY orden
    `);

    // 2. Obtener estudiantes matriculados (activos)
    const estudiantes = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT m.id as matricula_id, e.nombres, e.apellido_paterno, e.apellido_materno, e.dni
      FROM "${slug}".matriculas m
      JOIN "${slug}".estudiantes e ON m.estudiante_id = e.id
      WHERE m.seccion_id = '${seccionId}' AND m.estado = 'ACTIVA'
      ORDER BY e.apellido_paterno, e.apellido_materno
    `);

    // 3. Obtener notas existentes para este periodo y área (via competencias)
    const notas = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "${slug}".notas_periodo 
      WHERE periodo_id = '${periodoId}' 
      AND competencia_ie_id IN (SELECT id FROM "${slug}".competencias_ie WHERE area_ie_id = '${areaId}')
    `);

    return {
      competencias,
      estudiantes: estudiantes.map(est => ({
        ...est,
        notas: competencias.map(comp => {
          const nota = notas.find(n => n.matricula_id === est.matricula_id && n.competencia_ie_id === comp.id);
          return {
            competenciaIeId: comp.id,
            calificativoLiteral: nota?.calificativo_literal || null,
            calificativoNumerico: nota?.calificativo_numerico || null,
            conclusionDescriptiva: nota?.conclusion_descriptiva || '',
          };
        }),
      })),
    };
  }

  async saveGrilla(slug: string, dto: SaveGrillaDto, usuarioId: string) {
    const { periodoId, notas } = dto;

    for (const nota of notas) {
      const literal = nota.calificativoLiteral ? `'${nota.calificativoLiteral}'::"${slug}".calificativo_literal` : 'NULL';
      const numerico = nota.calificativoNumerico !== undefined ? nota.calificativoNumerico : 'NULL';
      const conclusion = nota.conclusionDescriptiva ? `'${nota.conclusionDescriptiva.replace(/'/g, "''")}'` : 'NULL';

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "${slug}".notas_periodo 
          (matricula_id, competencia_ie_id, periodo_id, calificativo_literal, calificativo_numerico, conclusion_descriptiva, registrado_por)
        VALUES 
          ('${nota.matriculaId}', '${nota.competenciaIeId}', '${periodoId}', ${literal}, ${numerico}, ${conclusion}, '${usuarioId}')
        ON CONFLICT (matricula_id, competencia_ie_id, periodo_id) 
        DO UPDATE SET 
          calificativo_literal = EXCLUDED.calificativo_literal,
          calificativo_numerico = EXCLUDED.calificativo_numerico,
          conclusion_descriptiva = EXCLUDED.conclusion_descriptiva,
          modificado_por = '${usuarioId}',
          ultima_modificacion = NOW()
      `);
    }

    return { message: 'Notas guardadas correctamente' };
  }

  async getEstudianteNotas(slug: string, matriculaId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT n.*, c.nombre_display as competencia_nombre, a.nombre_display as area_nombre, p.nombre as periodo_nombre
      FROM "${slug}".notas_periodo n
      JOIN "${slug}".competencias_ie c ON n.competencia_ie_id = c.id
      JOIN "${slug}".areas_ie a ON c.area_ie_id = a.id
      JOIN "${slug}".periodos p ON n.periodo_id = p.id
      WHERE n.matricula_id = '${matriculaId}'
      ORDER BY p.orden, a.orden, c.orden
    `);
  }

  async cerrarPeriodo(slug: string, periodoId: string, seccionId: string, usuarioId: string) {
    // 1. Verificar si ya está cerrado
    const existing = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "${slug}".cierre_periodo WHERE periodo_id = '${periodoId}' AND seccion_id = '${seccionId}'
    `);

    if (existing[0]?.estado === 'CERRADO') {
      return { message: 'El periodo ya se encuentra cerrado para esta sección' };
    }

    // 2. Calcular porcentaje de avance (opcional para el log)
    // 3. Upsert cierre
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO "${slug}".cierre_periodo 
        (periodo_id, seccion_id, estado, notas_completas, porcentaje_notas_completas, cerrado_por, cerrado_en)
      VALUES 
        ('${periodoId}', '${seccionId}', 'CERRADO'::"${slug}".estado_periodo, true, 100, '${usuarioId}', NOW())
      ON CONFLICT (periodo_id, seccion_id) DO UPDATE SET
        estado = 'CERRADO'::"${slug}".estado_periodo,
        cerrado_por = EXCLUDED.cerrado_por,
        cerrado_en = NOW()
    `);

    return { message: 'Periodo cerrado correctamente' };
  }

  async exportarSiagie(slug: string, periodoId: string, seccionId: string, usuarioId?: string): Promise<Buffer> {
    const data = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        e.codigo_siagie, e.dni, e.apellido_paterno, e.apellido_materno, e.nombres,
        c.nombre_display as competencia_nombre, a.nombre_display as area_nombre,
        n.calificativo_literal, n.calificativo_numerico, n.conclusion_descriptiva
      FROM "${slug}".matriculas m
      JOIN "${slug}".estudiantes e ON m.estudiante_id = e.id
      JOIN "${slug}".secciones s ON m.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      JOIN "${slug}".competencias_ie c ON c.area_ie_id IN (SELECT id FROM "${slug}".areas_ie WHERE anio_escolar_id = s.anio_escolar_id)
      LEFT JOIN "${slug}".notas_periodo n ON n.matricula_id = m.id AND n.competencia_ie_id = c.id AND n.periodo_id = '${periodoId}'
      WHERE m.seccion_id = '${seccionId}' AND m.estado = 'ACTIVA'
      ORDER BY e.apellido_paterno, e.apellido_materno, c.orden
    `);

    const periodo = await this.prisma.$queryRawUnsafe<any[]>(`SELECT nombre, anio_escolar_id FROM "${slug}".periodos WHERE id = '${periodoId}'`);
    const anioEscolarId = periodo[0]?.anio_escolar_id;
    const generadoPor = usuarioId ? `'${usuarioId}'` : 'NULL';

    // Log sync
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO "${slug}".siagie_sync_log (modulo, periodo_id, anio_escolar_id, estado, generado_por, generado_en)
      VALUES ('CALIFICACIONES', '${periodoId}', ${anioEscolarId ? `'${anioEscolarId}'` : 'NULL'}, 'GENERADO'::"${slug}".estado_sync, ${generadoPor}, NOW())
    `);

    return this.excelService.generateNotasExcel(data, periodo[0]?.nombre || 'Periodo');
  }
}
