import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMatriculaDto } from './dto/create-matricula.dto';

@Injectable()
export class MatriculasService {
  private readonly logger = new Logger(MatriculasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(slug: string, anioEscolarId?: string, page: number = 1, limit: number = 20, filters?: any) {
    const skip = (page - 1) * limit;
    let whereClause = `WHERE 1=1`;
    
    if (anioEscolarId) {
      whereClause += ` AND m.anio_escolar_id = '${anioEscolarId}'`;
    }
    if (filters?.seccionId) {
      whereClause += ` AND m.seccion_id = '${filters.seccionId}'`;
    }
    if (filters?.estado) {
      whereClause += ` AND m.estado = '${filters.estado}'`;
    }
    if (filters?.estudianteId) {
      whereClause += ` AND m.estudiante_id = '${filters.estudianteId}'`;
    }

    const query = `
      SELECT m.*, e.nombres, e.apellido_paterno, e.apellido_materno, e.dni, s.nombre as seccion_nombre, g.nombre as grado_nombre
      FROM "${slug}".matriculas m
      JOIN "${slug}".estudiantes e ON m.estudiante_id = e.id
      JOIN "${slug}".secciones s ON m.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      ${whereClause}
      ORDER BY g.orden, s.nombre, e.apellido_paterno
      LIMIT ${limit} OFFSET ${skip}
    `;

    const data = await this.prisma.$queryRawUnsafe<any[]>(query);

    const countResult = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total FROM "${slug}".matriculas m ${whereClause}`
    );
    const total = parseInt(countResult[0]?.total ?? '0', 10);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(slug: string, id: string) {
    const query = `
      SELECT m.*, e.nombres, e.apellido_paterno, e.apellido_materno, e.dni, s.nombre as seccion_nombre, g.nombre as grado_nombre
      FROM "${slug}".matriculas m
      JOIN "${slug}".estudiantes e ON m.estudiante_id = e.id
      JOIN "${slug}".secciones s ON m.seccion_id = s.id
      JOIN "${slug}".grados g ON s.grado_id = g.id
      WHERE m.id = '${id}'
    `;
    const result = await this.prisma.$queryRawUnsafe<any[]>(query);
    if (!result[0]) throw new NotFoundException('Matrícula no encontrada');
    return result[0];
  }

  async create(slug: string, dto: CreateMatriculaDto, registradoPor: string) {
    // Verificar si el estudiante ya está matriculado en ese año escolar
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "${slug}".matriculas 
       WHERE estudiante_id = '${dto.estudianteId}' AND anio_escolar_id = '${dto.anioEscolarId}'`
    );
    if (existing.length > 0) {
      throw new ConflictException('El estudiante ya cuenta con una matrícula para este año escolar');
    }

    const fields = [
      'anio_escolar_id', 'estudiante_id', 'seccion_id', 'tipo_matricula',
      'condicion_matricula', 'fecha_matricula', 'fecha_inicio',
      'ie_procedencia', 'codigo_modular_procedencia', 'repeticiones_en_nivel',
      'registrado_por'
    ];

    const values = [
      `'${dto.anioEscolarId}'`,
      `'${dto.estudianteId}'`,
      `'${dto.seccionId}'`,
      `'${dto.tipoMatricula}'`,
      `'${dto.condicionMatricula}'`,
      `'${dto.fechaMatricula}'`,
      `'${dto.fechaInicio}'`,
      dto.ieProcedencia ? `'${dto.ieProcedencia}'` : 'NULL',
      dto.codigoModularProcedencia ? `'${dto.codigoModularProcedencia}'` : 'NULL',
      dto.repeticionesEnNivel ? dto.repeticionesEnNivel : 0,
      `'${registradoPor}'`
    ];

    const query = `
      INSERT INTO "${slug}".matriculas (${fields.join(', ')})
      VALUES (${values.join(', ')})
      RETURNING *
    `;

    const result = await this.prisma.$queryRawUnsafe<any[]>(query);
    return result[0];
  }

  async update(slug: string, id: string, dto: any) {
    const updates: string[] = [];
    if (dto.seccionId) updates.push(`seccion_id = '${dto.seccionId}'`);
    if (dto.tipoMatricula) updates.push(`tipo_matricula = '${dto.tipoMatricula}'`);
    if (dto.condicionMatricula) updates.push(`condicion_matricula = '${dto.condicionMatricula}'`);
    if (dto.estado) updates.push(`estado = '${dto.estado}'::"${slug}".estado_matricula`);
    
    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE "${slug}".matriculas
      SET ${updates.join(', ')}
      WHERE id = '${id}'
      RETURNING *
    `;

    const result = await this.prisma.$queryRawUnsafe<any[]>(query);
    return result[0];
  }

  async retirar(slug: string, id: string, fechaRetiro: string, motivo: string) {
    const query = `
      UPDATE "${slug}".matriculas
      SET estado = 'RETIRADA', fecha_retiro = '${fechaRetiro}', motivo_retiro = '${motivo}', updated_at = NOW()
      WHERE id = '${id}'
      RETURNING *
    `;
    const result = await this.prisma.$queryRawUnsafe<any[]>(query);
    if (!result[0]) throw new NotFoundException('Matrícula no encontrada');
    return result[0];
  }
}
