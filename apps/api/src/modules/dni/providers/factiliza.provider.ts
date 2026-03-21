import { Logger } from '@nestjs/common';
import { IDniProvider, DniLookupResult } from '../interfaces/dni-provider.interface';

export class FactilizaProvider implements IDniProvider {
  readonly name = 'Factiliza';
  private readonly logger = new Logger(FactilizaProvider.name);
  private readonly baseUrl = 'https://api.factiliza.com/v1/dni/info';

  constructor(private readonly token: string) {}

  async lookup(dni: string): Promise<DniLookupResult> {
    const url = `${this.baseUrl}/${dni}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json() as any;

    if (!json?.success || !json?.data) {
      throw new Error('Respuesta inválida del proveedor');
    }

    const d = json.data;

    return {
      dni,
      nombres: this.normalize(d.nombres),
      apellidoPaterno: this.normalize(d.apellido_paterno),
      apellidoMaterno: this.normalize(d.apellido_materno ?? ''),
      fechaNacimiento: this.parseDate(d.fecha_nacimiento),
      genero: this.parseGenero(d.sexo),
      ubigeo: d.ubigeo_reniec ?? undefined,
    };
  }

  /** Convierte DD/MM/YYYY a YYYY-MM-DD */
  private parseDate(raw: string): string {
    if (!raw) return '';
    // Formato DD/MM/YYYY
    if (raw.includes('/')) {
      const [day, month, year] = raw.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Ya en formato ISO
    return raw;
  }

  private parseGenero(raw: string): 'M' | 'F' | '' {
    const val = (raw ?? '').toUpperCase().trim();
    if (!val) return '';
    if (val === 'F' || val.startsWith('FEM')) return 'F';
    if (val === 'M' || val.startsWith('MAS')) return 'M';
    return '';
  }

  /** Capitaliza correctamente: "JUAN ALBERTO" → "Juan Alberto" */
  private normalize(text: string): string {
    return (text ?? '')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }
}
