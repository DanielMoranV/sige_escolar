import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PromocionService {
  private readonly logger = new Logger(PromocionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calcularResultadoMatricula(slug: string, matriculaId: string, nivel: string, gradoNumero: number) {
    // Exenciones normativas
    if (nivel === 'INICIAL' || (nivel === 'PRIMARIA' && gradoNumero === 1)) {
      return { resultado: 'PROMOVIDO', areasRecuperacion: [] };
    }

    // Obtener la última nota ingresada por cada competencia (asumiendo que es la final del año)
    // Se excluyen las competencias donde el alumno fue exonerado ('EXO')
    const notas = await this.prisma.$queryRawUnsafe<any[]>(`
      WITH RankedNotas AS (
        SELECT 
          n.competencia_ie_id,
          n.calificativo_literal,
          n.calificativo_numerico,
          c.area_ie_id,
          a.es_area_cneb,
          a.nombre_display,
          ROW_NUMBER() OVER(PARTITION BY n.competencia_ie_id ORDER BY p.orden DESC) as rn
        FROM "${slug}".notas_periodo n
        JOIN "${slug}".competencias_ie c ON n.competencia_ie_id = c.id
        JOIN "${slug}".areas_ie a ON c.area_ie_id = a.id
        JOIN "${slug}".periodos p ON n.periodo_id = p.id
        WHERE n.matricula_id = '${matriculaId}'
          AND (n.calificativo_literal IS NULL OR n.calificativo_literal != 'EXO')
      )
      SELECT * FROM RankedNotas WHERE rn = 1
    `);

    const areas = new Map<string, { id: string, nombre: string, cneb: boolean, competencias: any[] }>();

    for (const nota of notas) {
      if (!areas.has(nota.area_ie_id)) {
        areas.set(nota.area_ie_id, {
          id: nota.area_ie_id,
          nombre: nota.nombre_display,
          cneb: nota.es_area_cneb,
          competencias: []
        });
      }
      areas.get(nota.area_ie_id)!.competencias.push(nota);
    }

    let areasDesaprobadasCount = 0;
    const areasRecuperacionNombres: string[] = [];

    for (const area of areas.values()) {
      if (!area.cneb) continue; // Solo aplican las áreas de la currícula nacional para promoción

      const totalComp = area.competencias.length;
      if (totalComp === 0) continue;

      let compDesaprobadas = 0;
      for (const comp of area.competencias) {
        if (comp.calificativo_literal === 'C' || (comp.calificativo_numerico !== null && comp.calificativo_numerico <= 10)) {
          compDesaprobadas++;
        }
      }

      // Una área se considera deficiente si tiene C en la mitad o más de sus competencias
      if (compDesaprobadas >= totalComp / 2) {
        areasDesaprobadasCount++;
        areasRecuperacionNombres.push(area.nombre);
      }
    }

    let resultado = 'PROMOVIDO';
    // Reglas EBR:
    // >= 4 áreas deficientes -> PERMANECE
    // 1 a 3 áreas deficientes -> RECUPERACION
    if (areasDesaprobadasCount >= 4) {
      resultado = 'PERMANECE';
    } else if (areasDesaprobadasCount >= 1) {
      resultado = 'RECUPERACION';
    }

    return { 
      resultado, 
      areasRecuperacion: areasDesaprobadasCount >= 1 && areasDesaprobadasCount < 4 ? areasRecuperacionNombres : []
    };
  }
}
