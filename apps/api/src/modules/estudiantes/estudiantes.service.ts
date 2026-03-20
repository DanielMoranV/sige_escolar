import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';

@Injectable()
export class EstudiantesService {
  private readonly logger = new Logger(EstudiantesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(slug: string, page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    let whereClause = 'WHERE deleted_at IS NULL';
    
    if (search) {
      whereClause += ` AND (nombres ILIKE '%${search}%' OR apellido_paterno ILIKE '%${search}%' OR apellido_materno ILIKE '%${search}%' OR dni ILIKE '%${search}%')`;
    }

    const data = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".estudiantes 
       ${whereClause} 
       ORDER BY apellido_paterno, apellido_materno 
       LIMIT ${limit} OFFSET ${skip}`
    );

    const countResult = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total FROM "${slug}".estudiantes ${whereClause}`
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
    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".estudiantes WHERE id = '${id}' AND deleted_at IS NULL`
    );
    if (!result[0]) throw new NotFoundException('Estudiante no encontrado');
    return result[0];
  }

  async create(slug: string, dto: CreateEstudianteDto) {
    // Verificar si ya existe un estudiante con el mismo DNI o número de documento
    if (dto.dni || dto.numeroDocumento) {
      const doc = dto.dni || dto.numeroDocumento;
      const existing = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM "${slug}".estudiantes 
         WHERE (dni = '${doc}' OR numero_documento = '${doc}') AND deleted_at IS NULL`
      );
      if (existing.length > 0) {
        throw new ConflictException('Ya existe un estudiante con este documento');
      }
    }

    const fields = [
      'dni', 'tipo_documento', 'numero_documento', 'codigo_siagie',
      'apellido_paterno', 'apellido_materno', 'nombres', 'fecha_nacimiento',
      'genero', 'ubigeo_nacimiento', 'lengua_materna', 'etnia',
      'tiene_discapacidad', 'tipo_discapacidad', 'foto_url'
    ];

    const values = [
      dto.dni ? `'${dto.dni}'` : 'NULL',
      `'${dto.tipoDocumento}'`,
      `'${dto.numeroDocumento}'`,
      dto.codigoSiagie ? `'${dto.codigoSiagie}'` : 'NULL',
      `'${dto.apellidoPaterno}'`,
      dto.apellidoMaterno ? `'${dto.apellidoMaterno}'` : 'NULL',
      `'${dto.nombres}'`,
      `'${dto.fechaNacimiento}'`,
      `'${dto.genero}'`,
      dto.ubigeoNacimiento ? `'${dto.ubigeoNacimiento}'` : 'NULL',
      dto.lenguaMaterna ? `'${dto.lenguaMaterna}'` : "'CASTELLANO'",
      dto.etnia ? `'${dto.etnia}'` : 'NULL',
      dto.tieneDiscapacidad ? 'true' : 'false',
      dto.tipoDiscapacidad ? `'${dto.tipoDiscapacidad}'` : 'NULL',
      dto.fotoUrl ? `'${dto.fotoUrl}'` : 'NULL'
    ];

    const query = `
      INSERT INTO "${slug}".estudiantes (${fields.join(', ')})
      VALUES (${values.join(', ')})
      RETURNING *
    `;

    const result = await this.prisma.$queryRawUnsafe<any[]>(query);
    return result[0];
  }

  async update(slug: string, id: string, dto: any) {
    await this.findOne(slug, id);

    const updates = [];
    if (dto.apellidoPaterno) updates.push(`apellido_paterno = '${dto.apellidoPaterno}'`);
    if (dto.apellidoMaterno) updates.push(`apellido_materno = '${dto.apellidoMaterno}'`);
    if (dto.nombres) updates.push(`nombres = '${dto.nombres}'`);
    if (dto.codigoSiagie) updates.push(`codigo_siagie = '${dto.codigoSiagie}'`);
    if (dto.tieneDiscapacidad !== undefined) updates.push(`tiene_discapacidad = ${dto.tieneDiscapacidad}`);
    if (dto.tipoDiscapacidad) updates.push(`tipo_discapacidad = '${dto.tipoDiscapacidad}'`);
    if (dto.fotoUrl) updates.push(`foto_url = '${dto.fotoUrl}'`);
    
    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) return this.findOne(slug, id);

    const query = `
      UPDATE "${slug}".estudiantes
      SET ${updates.join(', ')}
      WHERE id = '${id}'
      RETURNING *
    `;

    const result = await this.prisma.$queryRawUnsafe<any[]>(query);
    return result[0];
  }

  async remove(slug: string, id: string) {
    await this.findOne(slug, id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE "${slug}".estudiantes SET deleted_at = NOW() WHERE id = '${id}'`
    );
    return { message: 'Estudiante eliminado correctamente' };
  }

  async validateDni(dni: string) {
    // Simulación de respuesta RENIEC
    this.logger.log(`Validando DNI ${dni} con RENIEC (Simulado)`);
    
    // En un escenario real aquí llamaríamos a un servicio externo
    // Por ahora retornamos datos estáticos para pruebas
    return {
      dni,
      nombres: 'JUAN ALBERTO',
      apellidoPaterno: 'QUISPE',
      apellidoMaterno: 'MAMANI',
      fechaNacimiento: '2015-05-20',
      genero: 'M',
      ubigeo: '150101'
    };
  }
}
