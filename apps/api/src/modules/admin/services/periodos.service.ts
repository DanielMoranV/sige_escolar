import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

interface PeriodoToInsert {
  nivel: string;
  codigo: string;
  nombre: string;
  orden: number;
  fechaInicio: Date;
  fechaFin: Date;
}

@Injectable()
export class PeriodosService {
  private readonly logger = new Logger(PeriodosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generarPeriodos(
    slug: string,
    anioEscolarId: string,
    fechaInicio: Date,
    fechaFin: Date,
    nivelesList: string[],
    regimenMap: Record<string, string | undefined>,
  ): Promise<void> {
    this.logger.log(`Generating periods for tenant: ${slug}`);

    const niveles: Array<{ nivel: string; regimen: string }> = nivelesList.map((nivel) => ({
      nivel,
      regimen: regimenMap[nivel] ?? 'BIMESTRAL',
    }));

    let ordenGlobal = 1;

    for (const { nivel, regimen } of niveles) {
      const periodos = this.calcularPeriodos(nivel, regimen, fechaInicio, fechaFin, ordenGlobal);

      for (const periodo of periodos) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "${slug}".periodos
             (anio_escolar_id, nivel, codigo, nombre, orden, fecha_inicio, fecha_fin, estado)
           VALUES ($1, $2::public.nivel_educativo, $3, $4, $5, $6, $7, 'FUTURO'::"${slug}".estado_periodo)
           ON CONFLICT (anio_escolar_id, nivel, codigo) DO NOTHING`,
          anioEscolarId,
          periodo.nivel,
          periodo.codigo,
          periodo.nombre,
          periodo.orden,
          periodo.fechaInicio.toISOString().split('T')[0],
          periodo.fechaFin.toISOString().split('T')[0],
        );
      }

      ordenGlobal += periodos.length;
    }

    this.logger.log(`Periods generated for tenant: ${slug}`);
  }

  private calcularPeriodos(
    nivel: string,
    regimen: string,
    fechaInicio: Date,
    fechaFin: Date,
    ordenBase: number,
  ): PeriodoToInsert[] {
    const periodos: PeriodoToInsert[] = [];

    let count: number;
    let prefix: string;
    let nombreTemplate: (i: number) => string;
    let codigoTemplate: (i: number) => string;

    switch (regimen) {
      case 'BIMESTRAL':
        count = 4;
        prefix = 'B';
        nombreTemplate = (i) => `${this.ordinal(i)} Bimestre`;
        codigoTemplate = (i) => `B${i}`;
        break;
      case 'TRIMESTRAL':
        count = 3;
        prefix = 'T';
        nombreTemplate = (i) => `${this.ordinal(i)} Trimestre`;
        codigoTemplate = (i) => `T${i}`;
        break;
      case 'SEMESTRAL':
        count = 2;
        prefix = 'S';
        nombreTemplate = (i) => `${this.ordinal(i)} Semestre`;
        codigoTemplate = (i) => `S${i}`;
        break;
      default:
        count = 4;
        prefix = 'B';
        nombreTemplate = (i) => `${this.ordinal(i)} Bimestre`;
        codigoTemplate = (i) => `B${i}`;
    }

    // Distribute dates evenly across school year
    const totalMs = fechaFin.getTime() - fechaInicio.getTime();
    const periodMs = Math.floor(totalMs / count);

    for (let i = 1; i <= count; i++) {
      const pInicio = new Date(fechaInicio.getTime() + periodMs * (i - 1));
      const pFin = i === count ? fechaFin : new Date(fechaInicio.getTime() + periodMs * i - 86400000);

      periodos.push({
        nivel,
        codigo: codigoTemplate(i),
        nombre: nombreTemplate(i),
        orden: ordenBase + i - 1,
        fechaInicio: pInicio,
        fechaFin: pFin,
      });
    }

    // Add RECUPERACION period (2 weeks after school year end)
    const recInicio = new Date(fechaFin.getTime() + 7 * 86400000);
    const recFin = new Date(fechaFin.getTime() + 21 * 86400000);
    periodos.push({
      nivel,
      codigo: 'REC',
      nombre: 'Período de Recuperación',
      orden: ordenBase + count,
      fechaInicio: recInicio,
      fechaFin: recFin,
    });

    // Add ANUAL period (spans entire school year)
    periodos.push({
      nivel,
      codigo: 'ANUAL',
      nombre: 'Período Anual',
      orden: ordenBase + count + 1,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    });

    return periodos;
  }

  private ordinal(n: number): string {
    const map: Record<number, string> = {
      1: 'Primer',
      2: 'Segundo',
      3: 'Tercer',
      4: 'Cuarto',
      5: 'Quinto',
      6: 'Sexto',
    };
    return map[n] ?? `${n}°`;
  }
}
