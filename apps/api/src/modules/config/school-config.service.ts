import { Injectable, NotFoundException } from '@nestjs/common';
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

  async updateTenant(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }
}
