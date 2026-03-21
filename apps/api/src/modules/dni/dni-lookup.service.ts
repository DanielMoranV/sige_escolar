import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDniProvider, DniLookupResult } from './interfaces/dni-provider.interface';
import { FactilizaProvider } from './providers/factiliza.provider';

@Injectable()
export class DniLookupService {
  private readonly logger = new Logger(DniLookupService.name);
  private readonly providers: IDniProvider[];

  constructor(private readonly config: ConfigService) {
    /**
     * Cadena de proveedores en orden de prioridad.
     * Se intenta cada uno secuencialmente; si falla, se pasa al siguiente.
     * Para agregar un proveedor de respaldo, añadirlo aquí:
     *
     *   new MiOtroProvider(this.config.get('MI_OTRO_TOKEN'))
     */
    this.providers = [
      new FactilizaProvider(this.config.get<string>('FACTILIZA_TOKEN', '')),
    ];
  }

  /**
   * Intenta obtener datos del DNI recorriendo los proveedores en orden.
   * Lanza ServiceUnavailableException si todos fallan.
   */
  async lookup(dni: string): Promise<DniLookupResult> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        this.logger.log(`Consultando DNI ${dni} en ${provider.name}`);
        const result = await provider.lookup(dni);
        this.logger.log(`DNI ${dni} resuelto por ${provider.name}`);
        return result;
      } catch (err: any) {
        const msg = `${provider.name}: ${err?.message ?? 'error desconocido'}`;
        this.logger.warn(`Fallo en proveedor DNI — ${msg}`);
        errors.push(msg);
      }
    }

    throw new ServiceUnavailableException(
      `No se pudo consultar el DNI automáticamente (${errors.join(' | ')}). Puede ingresar los datos manualmente.`,
    );
  }
}
