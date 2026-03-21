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

  async updateTenant(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }
}
