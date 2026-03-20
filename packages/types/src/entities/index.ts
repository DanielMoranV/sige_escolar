export interface Tenant {
  id: string;
  slug: string;
  nombre: string;
  nombre_corto?: string;
  activo: boolean;
  plan: string;
  schema_name: string;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  tenant_id: string | null;
  email: string;
  rol: string;
  nombres: string;
  apellidos: string;
  dni?: string;
  telefono?: string;
  activo: boolean;
  ultimo_acceso?: string;
}

export interface AreaCneb {
  id: string;
  codigo: string;
  nombre: string;
  nivel: string;
  orden: number;
  permite_exoneracion: boolean;
  es_calificable: boolean;
  activo: boolean;
}

export interface CompetenciaCneb {
  id: string;
  area_id: string;
  codigo: string;
  nombre: string;
  orden: number;
  aplica_grados: number[];
  activo: boolean;
}
