import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ExcelService } from '../siagie/excel.service';
import { CreateAsistenciaBulkDto, AsistenciaItemDto } from './dto/create-asistencia-bulk.dto';
import { CreateJustificacionDto, ReviewJustificacionDto } from './dto/justificacion.dto';

@Injectable()
export class AsistenciaService {
  private readonly logger = new Logger(AsistenciaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelService
  ) {}

  async getSeccionAsistencia(slug: string, seccionId: string, fecha: string) {
    // 1. Obtener lista de estudiantes matriculados en la sección
    const estudiantes = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT m.id as matricula_id, e.nombres, e.apellido_paterno, e.apellido_materno, e.dni
      FROM "${slug}".matriculas m
      JOIN "${slug}".estudiantes e ON m.estudiante_id = e.id
      WHERE m.seccion_id = '${seccionId}' AND m.estado = 'ACTIVA'
      ORDER BY e.apellido_paterno, e.apellido_materno
    `);

    // 2. Obtener registros de asistencia ya existentes para esa fecha
    const asistencia = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "${slug}".asistencia_diaria 
      WHERE fecha = '${fecha}' AND matricula_id IN (
        SELECT id FROM "${slug}".matriculas WHERE seccion_id = '${seccionId}'
      )
    `);

    // 3. Mappear registros
    return estudiantes.map(est => {
      const registro = asistencia.find(a => a.matricula_id === est.matricula_id);
      return {
        ...est,
        asistenciaId: registro?.id || null,
        estado: registro?.estado || 'PRESENTE', // Default por UX
        observacion: registro?.observacion || '',
        horaLlegada: registro?.hora_llegada || null,
      };
    });
  }

  async registerBulk(slug: string, seccionId: string, fecha: string, dto: CreateAsistenciaBulkDto, usuarioId: string) {
    const anio = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT fecha_inicio::text, fecha_fin::text FROM "${slug}".anio_escolar_config WHERE activo = true LIMIT 1`
    );
    if (anio[0]) {
      if (fecha < anio[0].fecha_inicio || fecha > anio[0].fecha_fin) {
        throw new BadRequestException(
          `La fecha ${fecha} está fuera del año escolar (${anio[0].fecha_inicio} — ${anio[0].fecha_fin})`
        );
      }
    }

    for (const item of dto.items) {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "${slug}".asistencia_diaria 
          (matricula_id, fecha, estado, observacion, hora_llegada, registrado_por)
        VALUES 
          ('${item.matriculaId}', '${fecha}', '${item.estado}'::"${slug}".estado_asistencia, '${item.observacion || ''}', ${item.horaLlegada ? `'${item.horaLlegada}'` : 'NULL'}, '${usuarioId}')
        ON CONFLICT (matricula_id, fecha) 
        DO UPDATE SET 
          estado = EXCLUDED.estado,
          observacion = EXCLUDED.observacion,
          hora_llegada = EXCLUDED.hora_llegada,
          registrado_por = EXCLUDED.registrado_por,
          modificado_en = NOW()
      `);
    }
    return { message: 'Asistencia registrada correctamente' };
  }

  async getJustificacionesPendientes(slug: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT j.*, e.nombres, e.apellido_paterno, a.fecha as fecha_asistencia
      FROM "${slug}".justificaciones j
      JOIN "${slug}".asistencia_diaria a ON j.asistencia_id = a.id
      JOIN "${slug}".matriculas m ON a.matricula_id = m.id
      JOIN "${slug}".estudiantes e ON m.estudiante_id = e.id
      WHERE j.estado = 'PENDIENTE'
      ORDER BY j.created_at DESC
    `);
  }

  async createJustificacion(slug: string, dto: CreateJustificacionDto) {
    const plazo = new Date();
    plazo.setDate(plazo.getDate() + 5); // 5 días de plazo
    const plazoStr = plazo.toISOString().split('T')[0];

    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO "${slug}".justificaciones 
        (asistencia_id, tipo, motivo, documento_url, estado, plazo_vencimiento)
      VALUES 
        ('${dto.asistenciaId}', '${dto.tipo}', '${dto.motivo}', ${dto.documentoUrl ? `'${dto.documentoUrl}'` : 'NULL'}, 'PENDIENTE', '${plazoStr}')
      RETURNING *
    `);

    return result[0];
  }

  async reviewJustificacion(slug: string, id: string, dto: ReviewJustificacionDto, usuarioId: string) {
    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      UPDATE "${slug}".justificaciones 
      SET estado = '${dto.estado}'::"${slug}".estado_justificacion, 
          observacion_revision = '${dto.observacion || ''}',
          revisado_por = '${usuarioId}',
          revisado_en = NOW()
      WHERE id = '${id}'
      RETURNING *
    `);

    if (result.length === 0) throw new NotFoundException('Justificación no encontrada');

    // Si se aprueba, actualizar el estado en asistencia_diaria a FALTA_JUSTIFICADA
    if (dto.estado === 'APROBADA') {
      await this.prisma.$executeRawUnsafe(`
        UPDATE "${slug}".asistencia_diaria 
        SET estado = 'FALTA_JUSTIFICADA'
        WHERE id = '${result[0].asistencia_id}'
      `);
    }

    return result[0];
  }

  async getHistorialEstudiante(slug: string, matriculaId: string) {
    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        a.fecha::text,
        a.estado::text,
        a.observacion,
        cfg.fecha_inicio::text as anio_fecha_inicio,
        cfg.fecha_fin::text    as anio_fecha_fin
      FROM "${slug}".asistencia_diaria a
      JOIN "${slug}".anio_escolar_config cfg ON cfg.activo = true
      WHERE a.matricula_id = '${matriculaId}'
        AND a.fecha >= cfg.fecha_inicio
      ORDER BY a.fecha
    `);

    const anio = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT fecha_inicio::text, fecha_fin::text FROM "${slug}".anio_escolar_config WHERE activo = true LIMIT 1`
    );

    return {
      fechaInicio: anio[0]?.fecha_inicio ?? null,
      fechaFin: anio[0]?.fecha_fin ?? null,
      registros: result.map(r => ({ fecha: r.fecha, estado: r.estado, observacion: r.observacion })),
    };
  }

  async getAlertas(slug: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT al.*, e.nombres, e.apellido_paterno, g.nombre as grado, s.nombre as seccion, g.nivel::text as nivel_educativo
      FROM "${slug}".alertas_asistencia al
      JOIN "${slug}".matriculas m ON al.matricula_id = m.id
      JOIN "${slug}".estudiantes e ON m.estudiante_id = e.id
      JOIN "${slug}".secciones s ON m.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      WHERE al.atendida = false
      ORDER BY al.nivel_alerta DESC, al.porcentaje_asistencia ASC
    `);
  }

  async calcularAlertas(slug: string, anioEscolarId: string) {
    // 1. Cargar configuración de umbrales (con fallback a RM 281-2016-MINEDU)
    const configResult = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".config_asistencia WHERE anio_escolar_id = '${anioEscolarId}' LIMIT 1`
    );
    const config = configResult[0] ?? {
      tardanzas_por_falta: 3,
      umbral_amarillo: 10.00,
      umbral_naranja: 20.00,
      umbral_rojo: 30.00,
      contar_tardanzas: true,
    };
    const tardanzasPorFalta = parseInt(config.tardanzas_por_falta, 10);
    const umbralAmarillo = parseFloat(config.umbral_amarillo);
    const umbralNaranja = parseFloat(config.umbral_naranja);
    const umbralRojo = parseFloat(config.umbral_rojo);
    const contarTardanzas = config.contar_tardanzas === true || config.contar_tardanzas === 'true';

    // 2. Obtener días lectivos transcurridos hasta hoy
    const today = new Date().toISOString().split('T')[0];
    const diasResult = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count FROM "${slug}".calendario_escolar
      WHERE anio_escolar_id = '${anioEscolarId}' AND tipo_dia = 'LECTIVO' AND fecha <= '${today}'
    `);
    const diasTranscurridos = parseInt(diasResult[0]?.count ?? '0', 10);
    if (diasTranscurridos === 0) return { message: 'No hay días lectivos transcurridos aún' };

    // 3. Obtener resumen de inasistencias por matrícula
    const inasistencias = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        m.id as matricula_id,
        COUNT(CASE WHEN a.estado = 'FALTA_INJUSTIFICADA' THEN 1 END) as faltas_injustificadas,
        COUNT(CASE WHEN a.estado = 'TARDANZA' THEN 1 END) as tardanzas
      FROM "${slug}".matriculas m
      LEFT JOIN "${slug}".asistencia_diaria a ON m.id = a.matricula_id
      WHERE m.anio_escolar_id = '${anioEscolarId}' AND m.estado = 'ACTIVA'
      GROUP BY m.id
    `);

    // 4. Upsert alertas con umbrales configurables y conversión tardanzas→faltas
    for (const row of inasistencias) {
      const faltas = parseInt(row.faltas_injustificadas, 10);
      const tardanzas = parseInt(row.tardanzas, 10);
      const faltasEquivalentes = contarTardanzas ? Math.floor(tardanzas / tardanzasPorFalta) : 0;
      const faltasEfectivas = faltas + faltasEquivalentes;
      const porcentaje = ((diasTranscurridos - faltasEfectivas) / diasTranscurridos) * 100;
      const inasistenciaPorc = (faltasEfectivas / diasTranscurridos) * 100;

      let nivel: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO' = 'VERDE';
      if (inasistenciaPorc >= umbralRojo) nivel = 'ROJO';
      else if (inasistenciaPorc >= umbralNaranja) nivel = 'NARANJA';
      else if (inasistenciaPorc >= umbralAmarillo) nivel = 'AMARILLO';

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "${slug}".alertas_asistencia
          (matricula_id, nivel_alerta, porcentaje_asistencia, faltas_injustificadas, tardanzas_acumuladas, ultima_actualizacion)
        VALUES
          ('${row.matricula_id}', '${nivel}', ${Math.max(0, porcentaje).toFixed(2)}, ${faltasEfectivas}, ${tardanzas}, NOW())
        ON CONFLICT (matricula_id) DO UPDATE SET
          nivel_alerta = EXCLUDED.nivel_alerta,
          porcentaje_asistencia = EXCLUDED.porcentaje_asistencia,
          faltas_injustificadas = EXCLUDED.faltas_injustificadas,
          tardanzas_acumuladas = EXCLUDED.tardanzas_acumuladas,
          ultima_actualizacion = NOW()
      `);
    }

    return { message: 'Alertas recalculadas correctamente' };
  }

  async exportarSiagie(slug: string, mes: number, anioEscolarId: string, seccionId?: string): Promise<Buffer> {
    const whereSeccion = seccionId ? `AND m.seccion_id = '${seccionId}'` : '';
    
    const data = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        e.codigo_siagie, e.dni, e.apellido_paterno, e.apellido_materno, e.nombres,
        COUNT(CASE WHEN a.estado IN ('PRESENTE', 'TARDANZA', 'LICENCIA') THEN 1 END)::int as asistencias,
        COUNT(CASE WHEN a.estado = 'FALTA_JUSTIFICADA' THEN 1 END)::int as faltas_justificadas,
        COUNT(CASE WHEN a.estado = 'FALTA_INJUSTIFICADA' THEN 1 END)::int as faltas_injustificadas
      FROM "${slug}".matriculas m
      JOIN "${slug}".estudiantes e ON m.estudiante_id = e.id
      LEFT JOIN "${slug}".asistencia_diaria a ON m.id = a.matricula_id AND EXTRACT(MONTH FROM a.fecha) = ${mes}
      WHERE m.anio_escolar_id = '${anioEscolarId}' ${whereSeccion}
      GROUP BY e.id, m.id
      ORDER BY e.apellido_paterno, e.apellido_materno
    `);

    // Registrar intención de exportación al SIAGIE (no-crítico)
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "${slug}".siagie_sync_log (modulo, anio_escolar_id, estado, generado_en)
        VALUES ('ASISTENCIA', '${anioEscolarId}', 'GENERADO'::"${slug}".estado_sync, NOW())
      `);
    } catch {
      this.logger.warn(`[${slug}] No se pudo registrar sync_log para asistencia — tabla puede no existir aún`);
    }

    return this.excelService.generateAsistenciaExcel(data, mes, 20);
  }
}
