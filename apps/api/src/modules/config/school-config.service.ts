import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SchoolConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnioEscolar(slug: string) {
    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".anio_escolar_config WHERE activo = true LIMIT 1`
    );
    if (!result[0]) throw new NotFoundException('Año escolar no configurado');
    return result[0];
  }

  async getPeriodos(slug: string, anioEscolarId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".periodos 
       WHERE anio_escolar_id = '${anioEscolarId}' 
       ORDER BY nivel, orden`
    );
  }

  async getRegimen(slug: string, anioEscolarId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".regimen_config 
       WHERE anio_escolar_id = '${anioEscolarId}'`
    );
  }

  async getAreas(slug: string, anioEscolarId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".areas_ie
       WHERE anio_escolar_id = '${anioEscolarId}' AND activa = true
       ORDER BY nivel, orden`
    );
  }

  async getAllAreas(slug: string, anioEscolarId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".areas_ie
       WHERE anio_escolar_id = '${anioEscolarId}'
       ORDER BY nivel, orden`
    );
  }

  async createArea(slug: string, anioEscolarId: string, dto: {
    nombreDisplay: string;
    codigoDisplay?: string;
    nivel: string;
    orden?: number;
    permiteExoneracion?: boolean;
    esCalificable?: boolean;
    pesoArea?: number;
  }) {
    const ordenFinal = dto.orden ?? await this.nextOrdenArea(slug, anioEscolarId, dto.nivel);
    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO "${slug}".areas_ie
        (anio_escolar_id, nombre_display, codigo_display, nivel, es_area_cneb, orden, permite_exoneracion, es_calificable, peso_area, activa)
      VALUES (
        '${anioEscolarId}',
        '${dto.nombreDisplay.replace(/'/g, "''")}',
        ${dto.codigoDisplay ? `'${dto.codigoDisplay.replace(/'/g, "''")}'` : 'NULL'},
        '${dto.nivel}'::public.nivel_educativo,
        false,
        ${ordenFinal},
        ${dto.permiteExoneracion ?? false},
        ${dto.esCalificable ?? true},
        ${dto.pesoArea ?? 1.00},
        true
      )
      ON CONFLICT (anio_escolar_id, nombre_display, nivel) DO NOTHING
      RETURNING *
    `);
    if (!result[0]) throw new ConflictException('Ya existe un área con ese nombre en ese nivel');
    return result[0];
  }

  async updateArea(slug: string, id: string, dto: {
    nombreDisplay?: string;
    codigoDisplay?: string;
    orden?: number;
    permiteExoneracion?: boolean;
    esCalificable?: boolean;
    pesoArea?: number;
    activa?: boolean;
  }) {
    const parts: string[] = [];
    if (dto.nombreDisplay !== undefined)      parts.push(`nombre_display = '${dto.nombreDisplay.replace(/'/g, "''")}'`);
    if (dto.codigoDisplay !== undefined)      parts.push(`codigo_display = ${dto.codigoDisplay ? `'${dto.codigoDisplay.replace(/'/g, "''")}'` : 'NULL'}`);
    if (dto.orden !== undefined)              parts.push(`orden = ${dto.orden}`);
    if (dto.permiteExoneracion !== undefined) parts.push(`permite_exoneracion = ${dto.permiteExoneracion}`);
    if (dto.esCalificable !== undefined)      parts.push(`es_calificable = ${dto.esCalificable}`);
    if (dto.pesoArea !== undefined)           parts.push(`peso_area = ${dto.pesoArea}`);
    if (dto.activa !== undefined)             parts.push(`activa = ${dto.activa}`);
    if (parts.length === 0) throw new ConflictException('Sin cambios');
    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `UPDATE "${slug}".areas_ie SET ${parts.join(', ')} WHERE id = '${id}' RETURNING *`
    );
    if (!result[0]) throw new NotFoundException('Área no encontrada');
    return result[0];
  }

  async getCompetencias(slug: string, areaIeId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".competencias_ie
       WHERE area_ie_id = '${areaIeId}'
       ORDER BY orden`
    );
  }

  async createCompetencia(slug: string, areaIeId: string, dto: {
    nombreDisplay: string;
    orden?: number;
    pesoCompetencia?: number;
    aplicaGrados?: number[];
  }) {
    const ordenFinal = dto.orden ?? await this.nextOrdenCompetencia(slug, areaIeId);
    const aplicaGrados = dto.aplicaGrados && dto.aplicaGrados.length > 0
      ? `'{${dto.aplicaGrados.join(',')}}'`
      : `'{1,2,3,4,5,6}'`;
    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO "${slug}".competencias_ie
        (area_ie_id, nombre_display, orden, peso_competencia, aplica_grados, activa)
      VALUES (
        '${areaIeId}',
        '${dto.nombreDisplay.replace(/'/g, "''")}',
        ${ordenFinal},
        ${dto.pesoCompetencia ?? 1.00},
        ${aplicaGrados},
        true
      )
      ON CONFLICT (area_ie_id, orden) DO UPDATE SET orden = ${ordenFinal} + 1
      RETURNING *
    `);
    return result[0];
  }

  async updateCompetencia(slug: string, id: string, dto: {
    nombreDisplay?: string;
    orden?: number;
    pesoCompetencia?: number;
    aplicaGrados?: number[];
    activa?: boolean;
  }) {
    const parts: string[] = [];
    if (dto.nombreDisplay !== undefined)  parts.push(`nombre_display = '${dto.nombreDisplay.replace(/'/g, "''")}'`);
    if (dto.orden !== undefined)          parts.push(`orden = ${dto.orden}`);
    if (dto.pesoCompetencia !== undefined) parts.push(`peso_competencia = ${dto.pesoCompetencia}`);
    if (dto.aplicaGrados !== undefined)   parts.push(`aplica_grados = '{${dto.aplicaGrados.join(',')}}'`);
    if (dto.activa !== undefined)         parts.push(`activa = ${dto.activa}`);
    if (parts.length === 0) throw new ConflictException('Sin cambios');
    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `UPDATE "${slug}".competencias_ie SET ${parts.join(', ')} WHERE id = '${id}' RETURNING *`
    );
    if (!result[0]) throw new NotFoundException('Competencia no encontrada');
    return result[0];
  }

  private async nextOrdenArea(slug: string, anioEscolarId: string, nivel: string): Promise<number> {
    const res = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COALESCE(MAX(orden), 0) + 1 as next FROM "${slug}".areas_ie WHERE anio_escolar_id = '${anioEscolarId}' AND nivel = '${nivel}'::public.nivel_educativo`
    );
    return parseInt(res[0]?.next ?? '1', 10);
  }

  private async nextOrdenCompetencia(slug: string, areaIeId: string): Promise<number> {
    const res = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COALESCE(MAX(orden), 0) + 1 as next FROM "${slug}".competencias_ie WHERE area_ie_id = '${areaIeId}'`
    );
    return parseInt(res[0]?.next ?? '1', 10);
  }

  async getSecciones(slug: string, anioEscolarId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT s.*, g.nombre as grado_nombre, g.nivel
       FROM "${slug}".secciones s
       JOIN "${slug}".grados g ON s.grado_id = g.id
       WHERE s.anio_escolar_id = '${anioEscolarId}' AND s.activa = true
       ORDER BY g.orden, s.nombre`
    );
  }

  async getAllSecciones(slug: string, anioEscolarId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT s.*, g.nombre as grado_nombre, g.nivel,
              (SELECT COUNT(*)::int FROM "${slug}".matriculas m WHERE m.seccion_id = s.id AND m.estado = 'ACTIVA') as total_matriculados,
              (SELECT d.nombres || ' ' || d.apellidos FROM "${slug}".docente_area_seccion das JOIN "${slug}".docentes d ON das.docente_id = d.id WHERE das.seccion_id = s.id AND das.es_tutor = true LIMIT 1) as tutor_nombre
       FROM "${slug}".secciones s
       JOIN "${slug}".grados g ON s.grado_id = g.id
       WHERE s.anio_escolar_id = '${anioEscolarId}'
       ORDER BY g.orden, s.nombre`
    );
  }

  async getGrados(slug: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".grados ORDER BY orden`
    );
  }

  async createSeccion(slug: string, anioEscolarId: string, dto: { gradoId: string; nombre: string; turno?: string; aforoMaximo?: number }) {
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "${slug}".secciones WHERE anio_escolar_id = '${anioEscolarId}' AND grado_id = '${dto.gradoId}' AND nombre = '${dto.nombre}'`
    );
    if (existing.length > 0) {
      throw new ConflictException('Ya existe una sección con ese nombre en ese grado y año escolar');
    }
    const turno = dto.turno || 'MAÑANA';
    const aforo = dto.aforoMaximo ? `'${dto.aforoMaximo}'` : 'NULL';
    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "${slug}".secciones (anio_escolar_id, grado_id, nombre, turno, aforo_maximo)
       VALUES ('${anioEscolarId}', '${dto.gradoId}', '${dto.nombre}', '${turno}', ${aforo})
       RETURNING *`
    );
    return result[0];
  }

  async updateSeccion(slug: string, id: string, dto: { nombre?: string; turno?: string; aforoMaximo?: number; activa?: boolean }) {
    const parts: string[] = [];
    if (dto.nombre !== undefined) parts.push(`nombre = '${dto.nombre}'`);
    if (dto.turno !== undefined) parts.push(`turno = '${dto.turno}'`);
    if (dto.aforoMaximo !== undefined) parts.push(`aforo_maximo = ${dto.aforoMaximo}`);
    if (dto.activa !== undefined) parts.push(`activa = ${dto.activa}`);
    if (parts.length === 0) throw new ConflictException('Sin cambios');
    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `UPDATE "${slug}".secciones SET ${parts.join(', ')} WHERE id = '${id}' RETURNING *`
    );
    if (!result[0]) throw new NotFoundException('Sección no encontrada');
    return result[0];
  }

  async getConfigAsistencia(slug: string, anioEscolarId: string) {
    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".config_asistencia WHERE anio_escolar_id = '${anioEscolarId}' LIMIT 1`
    );
    if (!result[0]) {
      // Defaults for tenants that existed before this feature
      return { tardanzas_por_falta: 3, umbral_amarillo: 10.00, umbral_naranja: 20.00, umbral_rojo: 30.00, contar_tardanzas: true };
    }
    return result[0];
  }

  async updateConfigAsistencia(slug: string, anioEscolarId: string, dto: {
    tardanzasPorFalta?: number;
    umbralAmarillo?: number;
    umbralNaranja?: number;
    umbralRojo?: number;
    contarTardanzas?: boolean;
  }) {
    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO "${slug}".config_asistencia
        (anio_escolar_id, tardanzas_por_falta, umbral_amarillo, umbral_naranja, umbral_rojo, contar_tardanzas)
      VALUES (
        '${anioEscolarId}',
        ${dto.tardanzasPorFalta ?? 3},
        ${dto.umbralAmarillo ?? 10.00},
        ${dto.umbralNaranja ?? 20.00},
        ${dto.umbralRojo ?? 30.00},
        ${dto.contarTardanzas ?? true}
      )
      ON CONFLICT (anio_escolar_id) DO UPDATE SET
        tardanzas_por_falta = EXCLUDED.tardanzas_por_falta,
        umbral_amarillo     = EXCLUDED.umbral_amarillo,
        umbral_naranja      = EXCLUDED.umbral_naranja,
        umbral_rojo         = EXCLUDED.umbral_rojo,
        contar_tardanzas    = EXCLUDED.contar_tardanzas,
        updated_at          = NOW()
      RETURNING *
    `);
    return result[0];
  }

  async updateTenant(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }
}
