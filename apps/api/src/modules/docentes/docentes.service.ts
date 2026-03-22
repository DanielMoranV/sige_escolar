import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDocenteDto, UpdateDocenteDto, AsignarDto } from './dto/docente.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DocentesService {
  private readonly logger = new Logger(DocentesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAll(slug: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        d.*,
        u.email,
        COUNT(das.id)::int AS total_asignaciones
      FROM "${slug}".docentes d
      JOIN public.usuarios u ON d.usuario_id = u.id
      LEFT JOIN "${slug}".docente_area_seccion das ON das.docente_id = d.id
      GROUP BY d.id, u.email
      ORDER BY d.apellidos, d.nombres
    `);
  }

  async getAsignaciones(slug: string, docenteId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        das.id,
        das.es_tutor,
        ai.id AS area_ie_id,
        ai.nombre_display AS area_nombre,
        ai.nivel AS area_nivel,
        s.id AS seccion_id,
        s.nombre AS seccion_nombre,
        g.nombre AS grado_nombre,
        g.orden AS grado_orden
      FROM "${slug}".docente_area_seccion das
      JOIN "${slug}".areas_ie ai ON das.area_ie_id = ai.id
      JOIN "${slug}".secciones s ON das.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      WHERE das.docente_id = '${docenteId}'
      ORDER BY g.orden, s.nombre, ai.nombre_display
    `);
  }

  async create(slug: string, dto: CreateDocenteDto) {
    // Check DNI unique
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "${slug}".docentes WHERE dni = '${dto.dni.replace(/'/g, "''")}'`
    );
    if (existing.length > 0) {
      throw new ConflictException('Ya existe un docente con este DNI');
    }

    // Get tenant from slug
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    // Generate temp password
    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create public.usuarios record
    const usuario = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        dni: dto.dni,
        rol: 'DOCENTE_AREA',
        tenant_id: tenant.id,
        activo: true,
        needs_password_change: true,
      },
    });

    // Insert into tenant schema docentes
    const nombresSafe = dto.nombres.replace(/'/g, "''");
    const apellidosSafe = dto.apellidos.replace(/'/g, "''");
    const dniSafe = dto.dni.replace(/'/g, "''");
    const especialidadSafe = dto.especialidad ? `'${dto.especialidad.replace(/'/g, "''")}'` : 'NULL';

    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO "${slug}".docentes (usuario_id, dni, nombres, apellidos, especialidad)
      VALUES ('${usuario.id}', '${dniSafe}', '${nombresSafe}', '${apellidosSafe}', ${especialidadSafe})
      RETURNING *
    `);

    return { ...result[0], email: dto.email, tempPassword };
  }

  async update(slug: string, id: string, dto: UpdateDocenteDto) {
    const updates: string[] = [];

    if (dto.nombres !== undefined) updates.push(`nombres = '${dto.nombres.replace(/'/g, "''")}'`);
    if (dto.apellidos !== undefined) updates.push(`apellidos = '${dto.apellidos.replace(/'/g, "''")}'`);
    if (dto.especialidad !== undefined) {
      updates.push(`especialidad = '${dto.especialidad.replace(/'/g, "''")}'`);
    }
    if (dto.activo !== undefined) updates.push(`activo = ${dto.activo}`);

    updates.push(`updated_at = NOW()`);

    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      UPDATE "${slug}".docentes
      SET ${updates.join(', ')}
      WHERE id = '${id}'
      RETURNING *
    `);

    if (!result[0]) throw new NotFoundException('Docente no encontrado');
    return result[0];
  }

  async asignar(slug: string, dto: AsignarDto) {
    // Get active anio_escolar_id
    const anioResult = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "${slug}".anio_escolar_config WHERE activo = true LIMIT 1`
    );
    if (!anioResult[0]) throw new NotFoundException('No hay año escolar activo configurado');
    const anioEscolarId = anioResult[0].id;

    try {
      const result = await this.prisma.$queryRawUnsafe<any[]>(`
        INSERT INTO "${slug}".docente_area_seccion (anio_escolar_id, docente_id, area_ie_id, seccion_id, es_tutor)
        VALUES ('${anioEscolarId}', '${dto.docenteId}', '${dto.areaIeId}', '${dto.seccionId}', ${dto.esTutor ?? false})
        RETURNING *
      `);
      return result[0];
    } catch (err: any) {
      if (err?.code === '23505' || err?.message?.includes('unique')) {
        throw new ConflictException('Ya existe una asignación para esta sección y área en el año escolar activo');
      }
      throw err;
    }
  }

  async removeAsignacion(slug: string, id: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM "${slug}".docente_area_seccion WHERE id = '${id}'`
    );
    return { message: 'Asignación eliminada correctamente' };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
