import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

interface GradoSeed {
  nivel: string;
  numero: number;
  nombre: string;
  orden: number;
}

const GRADOS: GradoSeed[] = [
  { nivel: 'PRIMARIA',   numero: 1, nombre: 'Primer Grado',   orden: 1 },
  { nivel: 'PRIMARIA',   numero: 2, nombre: 'Segundo Grado',  orden: 2 },
  { nivel: 'PRIMARIA',   numero: 3, nombre: 'Tercer Grado',   orden: 3 },
  { nivel: 'PRIMARIA',   numero: 4, nombre: 'Cuarto Grado',   orden: 4 },
  { nivel: 'PRIMARIA',   numero: 5, nombre: 'Quinto Grado',   orden: 5 },
  { nivel: 'PRIMARIA',   numero: 6, nombre: 'Sexto Grado',    orden: 6 },
  { nivel: 'SECUNDARIA', numero: 1, nombre: 'Primer Año',     orden: 7 },
  { nivel: 'SECUNDARIA', numero: 2, nombre: 'Segundo Año',    orden: 8 },
  { nivel: 'SECUNDARIA', numero: 3, nombre: 'Tercer Año',     orden: 9 },
  { nivel: 'SECUNDARIA', numero: 4, nombre: 'Cuarto Año',     orden: 10 },
  { nivel: 'SECUNDARIA', numero: 5, nombre: 'Quinto Año',     orden: 11 },
];

@Injectable()
export class TenantSeedService {
  private readonly logger = new Logger(TenantSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedTenantBase(slug: string, anioEscolarId: string, niveles?: string[]): Promise<void> {
    this.logger.log(`Seeding base data for tenant: ${slug}`);
    await this.seedGrados(slug, niveles);
    await this.seedAreasAndCompetencias(slug, anioEscolarId, niveles);
    this.logger.log(`Base seed completed for tenant: ${slug}`);
  }

  private async seedGrados(slug: string, niveles?: string[]): Promise<void> {
    const gradosFiltrados = niveles ? GRADOS.filter((g) => niveles.includes(g.nivel)) : GRADOS;
    let orden = 1;
    for (const grado of gradosFiltrados) {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "${slug}".grados (nivel, numero, nombre, orden)
         VALUES ($1::public.nivel_educativo, $2, $3, $4)
         ON CONFLICT (nivel, numero) DO NOTHING`,
        grado.nivel,
        grado.numero,
        grado.nombre,
        grado.orden,
      );
    }
    this.logger.log(`Seeded ${GRADOS.length} grados for tenant: ${slug}`);
  }

  private async seedAreasAndCompetencias(slug: string, anioEscolarId: string, niveles?: string[]): Promise<void> {
    const nivelFilter = niveles && niveles.length > 0
      ? `AND nivel::text = ANY(ARRAY[${niveles.map((n) => `'${n}'`).join(',')}])`
      : '';

    const areasCneb = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; nombre: string; codigo: string; nivel: string; orden: number; permite_exoneracion: boolean }>
    >(`SELECT id, nombre, codigo, nivel::text, orden, permite_exoneracion FROM public.areas_cneb WHERE activo = true ${nivelFilter} ORDER BY nivel, orden`);

    if (!areasCneb || areasCneb.length === 0) {
      this.logger.warn('No areas_cneb found in public schema — skipping area seeding');
      return;
    }

    for (const area of areasCneb) {
      // Insert area_ie for this tenant
      const areaResult = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `INSERT INTO "${slug}".areas_ie
           (anio_escolar_id, area_cneb_id, nombre_display, codigo_display, nivel, es_area_cneb, orden, permite_exoneracion, es_calificable, peso_area, activa)
         VALUES ($1, $2, $3, $4, $5::public.nivel_educativo, true, $6, $7, true, 1.00, true)
         ON CONFLICT (anio_escolar_id, nombre_display, nivel) DO UPDATE SET area_cneb_id = EXCLUDED.area_cneb_id
         RETURNING id`,
        anioEscolarId,
        area.id,
        area.nombre,
        area.codigo,
        area.nivel,
        area.orden,
        area.permite_exoneracion ?? false,
      );

      if (!areaResult || areaResult.length === 0) continue;
      const areaIeId = areaResult[0].id;

      // Get competencias — column is 'area_id' per the Prisma schema mapping competencias_cneb
      const competencias = await this.prisma.$queryRawUnsafe<
        Array<{ id: string; nombre: string; orden: number; aplica_grados: number[] }>
      >(
        `SELECT id, nombre, orden, aplica_grados FROM public.competencias_cneb WHERE area_id = $1 AND activo = true ORDER BY orden`,
        area.id,
      );

      if (!competencias || competencias.length === 0) continue;

      for (const comp of competencias) {
        const aplicaGrados =
          comp.aplica_grados && comp.aplica_grados.length > 0
            ? comp.aplica_grados
            : [1, 2, 3, 4, 5, 6];
        const aplicaGradosLiteral = `{${aplicaGrados.join(',')}}`;

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "${slug}".competencias_ie
             (area_ie_id, competencia_cneb_id, nombre_display, orden, peso_competencia, aplica_grados, activa)
           VALUES ($1, $2, $3, $4, 1.00, $5, true)
           ON CONFLICT (area_ie_id, orden) DO NOTHING`,
          areaIeId,
          comp.id,
          comp.nombre,
          comp.orden,
          aplicaGradosLiteral,
        );
      }
    }

    this.logger.log(`Seeded areas and competencias for tenant: ${slug}`);
  }
}
