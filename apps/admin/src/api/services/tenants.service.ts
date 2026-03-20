import apiClient from '../client';

export interface TenantFilters {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  activo?: boolean;
}

export interface CreateTenantPayload {
  nombre: string;
  nombreCorto: string;
  plan: string;
  codigoModular: string;
  nombreOficial: string;
  dreCodigo: string;
  dreNombre: string;
  ugelCodigo: string;
  ugelNombre: string;
  tipoGestion: string;
  directorDni: string;
  directorNombres: string;
  directorApellidos: string;
  directorEmail: string;
  anioEscolar: number;
  fechaInicio: string;
  fechaFin: string;
  regimenPrimaria: string;
  regimenSecundaria: string;
}

export const tenantsService = {
  async getTenants(params: TenantFilters = {}) {
    const { data } = await apiClient.get('/tenants', { params });
    return data.data ?? data;
  },

  async getTenant(id: string) {
    const { data } = await apiClient.get(`/tenants/${id}`);
    return data.data ?? data;
  },

  async createTenant(payload: CreateTenantPayload) {
    const { data } = await apiClient.post('/tenants', payload);
    return data.data ?? data;
  },

  async updateTenant(id: string, payload: Record<string, unknown>) {
    const { data } = await apiClient.patch(`/tenants/${id}`, payload);
    return data.data ?? data;
  },

  async updateTenantStatus(id: string, activo: boolean) {
    const { data } = await apiClient.patch(`/tenants/${id}/status`, { activo });
    return data.data ?? data;
  },

  async getTenantStats(id: string) {
    const { data } = await apiClient.get(`/tenants/${id}/stats`);
    return data.data ?? data;
  },
};
