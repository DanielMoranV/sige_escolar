import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateApoderadoDto } from './dto/create-apoderado.dto';

@Injectable()
export class ApoderadosService {
  constructor(private readonly prisma: PrismaService) {}

  async findByDniOrDoc(slug: string, query: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".apoderados WHERE dni = '${query}' OR numero_documento = '${query}' LIMIT 1`
    ).then(res => res[0] || null);
  }

  async create(slug: string, dto: CreateApoderadoDto) {
    const doc = dto.dni || dto.numeroDocumento;
    const existing = await this.findByDniOrDoc(slug, doc);
    
    let apoderadoId = existing?.id;

    if (!apoderadoId) {
      const fields = [
        'tipo_documento', 'numero_documento', 'apellido_paterno', 'nombres'
      ];
      
      const values = [
        `'${dto.tipoDocumento}'`, `'${dto.numeroDocumento}'`, `'${dto.apellidoPaterno}'`, `'${dto.nombres}'`
      ];

      if (dto.dni) { fields.push('dni'); values.push(`'${dto.dni}'`); }
      if (dto.apellidoMaterno) { fields.push('apellido_materno'); values.push(`'${dto.apellidoMaterno}'`); }
      if (dto.telefono) { fields.push('telefono'); values.push(`'${dto.telefono}'`); }
      if (dto.email) { fields.push('email'); values.push(`'${dto.email}'`); }

      const insertQuery = `
        INSERT INTO "${slug}".apoderados (${fields.join(', ')})
        VALUES (${values.join(', ')})
        RETURNING id
      `;
      const result = await this.prisma.$queryRawUnsafe<any[]>(insertQuery);
      apoderadoId = result[0].id;
    }

    if (dto.estudianteId && dto.parentesco) {
      // Check if link exists
      const linkExists = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM "${slug}".estudiante_apoderado WHERE estudiante_id = '${dto.estudianteId}' AND apoderado_id = '${apoderadoId}'`
      );

      if (linkExists.length === 0) {
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO "${slug}".estudiante_apoderado (estudiante_id, apoderado_id, parentesco, es_apoderado_principal, vive_con_estudiante)
          VALUES (
            '${dto.estudianteId}', 
            '${apoderadoId}', 
            '${dto.parentesco}'::"${slug}".parentesco, 
            ${dto.esApoderadoPrincipal ? 'true' : 'false'}, 
            ${dto.viveConEstudiante === false ? 'false' : 'true'}
          )
        `);
      } else {
        // Update link
        await this.prisma.$executeRawUnsafe(`
          UPDATE "${slug}".estudiante_apoderado
          SET parentesco = '${dto.parentesco}'::"${slug}".parentesco,
              es_apoderado_principal = ${dto.esApoderadoPrincipal ? 'true' : 'false'},
              vive_con_estudiante = ${dto.viveConEstudiante === false ? 'false' : 'true'}
          WHERE estudiante_id = '${dto.estudianteId}' AND apoderado_id = '${apoderadoId}'
        `);
      }
    }

    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${slug}".apoderados WHERE id = '${apoderadoId}'`
    ).then(res => res[0]);
  }
}
