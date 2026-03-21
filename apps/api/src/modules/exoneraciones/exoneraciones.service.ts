import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateExoneracionDto } from './dto/create-exoneracion.dto';

@Injectable()
export class ExoneracionesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(slug: string, dto: CreateExoneracionDto, usuarioId: string) {
    // Verificar si el área permite exoneración
    const area = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT permite_exoneracion FROM "${slug}".areas_ie WHERE id = '${dto.areaIeId}'`
    );

    if (area.length === 0) {
      throw new NotFoundException('Área no encontrada');
    }

    if (!area[0].permite_exoneracion) {
      throw new ConflictException('Esta área no permite exoneraciones');
    }

    // Verificar si ya existe
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "${slug}".exoneraciones WHERE matricula_id = '${dto.matriculaId}' AND area_ie_id = '${dto.areaIeId}'`
    );

    if (existing.length > 0) {
      throw new ConflictException('Ya existe una exoneración para esta área y matrícula');
    }

    const fields = [
      'matricula_id', 'area_ie_id', 'tipo', 'motivo', 'fecha_solicitud', 'aprobada', 'aprobada_por'
    ];
    
    const values = [
      `'${dto.matriculaId}'`, `'${dto.areaIeId}'`, `'${dto.tipo}'`, `'${dto.motivo}'`, `'${dto.fechaSolicitud}'`, `true`, `'${usuarioId}'`
    ];

    if (dto.documentoUrl) {
      fields.push('documento_url');
      values.push(`'${dto.documentoUrl}'`);
    }

    const insertQuery = `
      INSERT INTO "${slug}".exoneraciones (${fields.join(', ')})
      VALUES (${values.join(', ')})
      RETURNING *
    `;

    const result = await this.prisma.$queryRawUnsafe<any[]>(insertQuery);
    return result[0];
  }
}
