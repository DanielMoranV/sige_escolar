import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Conversión literal → numérico para cálculo de promedio en primaria
const LITERAL_TO_NUM: Record<string, number> = { AD: 4, A: 3, B: 2, C: 1 };

/**
 * Convierte un promedio numérico de vuelta a calificativo literal (primaria).
 * Umbrales según doc §5.1.
 */
function numToLiteral(avg: number): string {
  if (avg >= 3.5) return 'AD';
  if (avg >= 2.5) return 'A';
  if (avg >= 1.5) return 'B';
  return 'C';
}

/**
 * Determina si una competencia es "deficiente" para efectos de promoción.
 *
 * Reglas por grado (R.V.M. 094-2020, doc §6.2 y §6.3):
 *   - Grados estrictos (2° y 5°): requieren mínimo A/AD en ≥ mitad de competencias.
 *     → Deficiente si el promedio anual es B o C (primaria) / < 14 (secundaria).
 *   - Otros grados: estándar — deficiente solo si el promedio es C / ≤ 10.
 */
function esCompDeficiente(
  nivel: string,
  esEstricto: boolean,
  finalLiteral: string | null,
  finalNumerico: number | null,
): boolean {
  if (nivel === 'PRIMARIA') {
    if (!finalLiteral) return false;
    return esEstricto ? finalLiteral === 'B' || finalLiteral === 'C' : finalLiteral === 'C';
  } else {
    if (finalNumerico === null) return false;
    return esEstricto ? finalNumerico < 14 : finalNumerico <= 10;
  }
}

@Injectable()
export class PromocionService {
  private readonly logger = new Logger(PromocionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcula la situación final del año para una matrícula.
   *
   * Implementa:
   *  1. Promedio anual por competencia sobre TODOS los periodos regulares
   *     (excluye períodos con código 'RECUPERACION' y 'ANUAL').
   *     Primaria: AD=4, A=3, B=2, C=1 → promedio → reconversión a literal.
   *     Secundaria: promedio numérico → redondeo al entero más cercano.
   *  2. Respeta peso_competencia (promedio ponderado dentro del área).
   *  3. Excluye competencias exoneradas (EXO) de los cálculos de promoción.
   *  4. Aplica reglas por grado (R.V.M. 094-2020):
   *     - Grados 2° y 5°: umbral estricto (B o C = deficiente en primaria; < 14 en secundaria).
   *     - Otros grados: umbral estándar (C = deficiente en primaria; ≤ 10 en secundaria).
   *  5. Cuenta solo áreas con es_area_cneb = TRUE para la decisión de promoción.
   */
  async calcularResultadoMatricula(
    slug: string,
    matriculaId: string,
    nivel: string,
    gradoNumero: number,
  ): Promise<{
    resultado: string;
    areasRecuperacion: string[];
    promediosAreas: Record<string, { literal: string | null; numerico: number | null }>;
  }> {
    // 1. Grados exentos de repetición (Inicial y 1° de Primaria)
    if (nivel === 'INICIAL' || (nivel === 'PRIMARIA' && gradoNumero === 1)) {
      return { resultado: 'PROMOVIDO', areasRecuperacion: [], promediosAreas: {} };
    }

    // 2. ¿Grado con regla estricta? (2° y 5° en cualquier nivel)
    const esGradoEstricto = gradoNumero === 2 || gradoNumero === 5;

    // 3. Promedio anual por competencia (todos los periodos regulares del año)
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        n.competencia_ie_id,
        c.area_ie_id,
        a.es_area_cneb,
        a.nombre_display                                       AS area_nombre,
        c.peso_competencia,
        BOOL_OR(n.calificativo_literal = 'EXO')               AS exonerado,
        -- Primaria: convierte literal → numérico, promedia, luego se reconvierte
        AVG(CASE n.calificativo_literal
          WHEN 'AD' THEN 4.0
          WHEN 'A'  THEN 3.0
          WHEN 'B'  THEN 2.0
          WHEN 'C'  THEN 1.0
          ELSE NULL
        END)                                                   AS promedio_literal_num,
        -- Secundaria: promedia directamente las notas numéricas
        AVG(n.calificativo_numerico::float)                    AS promedio_numerico
      FROM "${slug}".notas_periodo n
      JOIN "${slug}".competencias_ie c ON n.competencia_ie_id = c.id
      JOIN "${slug}".areas_ie        a ON c.area_ie_id = a.id
      JOIN "${slug}".periodos        p ON n.periodo_id  = p.id
      WHERE n.matricula_id = '${matriculaId}'
        AND p.codigo NOT IN ('RECUPERACION', 'ANUAL')
        AND p.anio_escolar_id = (
          SELECT anio_escolar_id FROM "${slug}".matriculas WHERE id = '${matriculaId}'
        )
      GROUP BY
        n.competencia_ie_id, c.area_ie_id, a.es_area_cneb,
        a.nombre_display, c.peso_competencia
    `);

    // 4. Agrupar competencias por área y calcular nota final por competencia
    type CompInfo = {
      exonerado: boolean;
      finalLiteral: string | null;
      finalNumerico: number | null;
      peso: number;
    };
    const areas = new Map<string, { nombre: string; cneb: boolean; comps: CompInfo[] }>();

    for (const row of rows) {
      if (!areas.has(row.area_ie_id)) {
        areas.set(row.area_ie_id, {
          nombre: row.area_nombre,
          cneb: Boolean(row.es_area_cneb),
          comps: [],
        });
      }

      const exonerado = Boolean(row.exonerado);
      const peso = parseFloat(row.peso_competencia) || 1;
      let finalLiteral: string | null = null;
      let finalNumerico: number | null = null;

      if (!exonerado) {
        if (nivel === 'PRIMARIA') {
          const avg = row.promedio_literal_num !== null ? parseFloat(row.promedio_literal_num) : null;
          finalLiteral = avg !== null ? numToLiteral(avg) : null;
        } else {
          const avg = row.promedio_numerico !== null ? parseFloat(row.promedio_numerico) : null;
          finalNumerico = avg !== null ? Math.round(avg) : null;
        }
      }

      areas.get(row.area_ie_id)!.comps.push({ exonerado, finalLiteral, finalNumerico, peso });
    }

    // 5. Evaluar cada área
    let areasDesaprobadasCount = 0;
    const areasRecuperacionNombres: string[] = [];
    const promediosAreas: Record<string, { literal: string | null; numerico: number | null }> = {};

    for (const area of areas.values()) {
      // Calcular promedio del área para almacenar en promedios_areas (JSONB)
      const conNota = area.comps.filter(c => !c.exonerado && (c.finalLiteral !== null || c.finalNumerico !== null));
      if (conNota.length > 0) {
        const totalPeso = conNota.reduce((s, c) => s + c.peso, 0);
        if (nivel === 'PRIMARIA') {
          const avgPond = conNota.reduce((s, c) => s + (LITERAL_TO_NUM[c.finalLiteral!] || 0) * c.peso, 0) / totalPeso;
          promediosAreas[area.nombre] = { literal: numToLiteral(avgPond), numerico: null };
        } else {
          const avgPond = conNota.reduce((s, c) => s + (c.finalNumerico || 0) * c.peso, 0) / totalPeso;
          promediosAreas[area.nombre] = { literal: null, numerico: Math.round(avgPond) };
        }
      }

      // Solo las áreas CNEB cuentan para la decisión de promoción (doc §10)
      if (!area.cneb) continue;

      const paraPromocion = area.comps.filter(c => !c.exonerado);
      const totalComp = paraPromocion.length;
      if (totalComp === 0) continue;

      const compDesaprobadas = paraPromocion.filter(c =>
        esCompDeficiente(nivel, esGradoEstricto, c.finalLiteral, c.finalNumerico),
      ).length;

      // Área deficiente si C en la mitad o más de sus competencias (regla base)
      // Para grados estrictos: B o C cuentan como deficiente
      if (compDesaprobadas >= totalComp / 2) {
        areasDesaprobadasCount++;
        areasRecuperacionNombres.push(area.nombre);
      }
    }

    // 6. Aplicar reglas EBR (doc §6.4)
    let resultado = 'PROMOVIDO';
    if (areasDesaprobadasCount >= 4) {
      resultado = 'PERMANECE';
    } else if (areasDesaprobadasCount >= 1) {
      resultado = 'RECUPERACION';
    }

    return {
      resultado,
      areasRecuperacion: areasDesaprobadasCount > 0 && areasDesaprobadasCount < 4
        ? areasRecuperacionNombres
        : [],
      promediosAreas,
    };
  }
}
