export interface DniLookupResult {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  /** Fecha en formato ISO: YYYY-MM-DD. Puede venir vacío si el proveedor no la entrega. */
  fechaNacimiento: string;
  /** Puede venir vacío si el proveedor no entrega el sexo. */
  genero: 'M' | 'F' | '';
  ubigeo?: string;
}

export interface IDniProvider {
  /** Nombre del proveedor, para logs y mensajes de error */
  readonly name: string;
  lookup(dni: string): Promise<DniLookupResult>;
}
