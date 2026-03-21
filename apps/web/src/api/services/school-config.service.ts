import apiClient from '../client';

export const schoolConfigService = {
  async getAnioEscolar() {
    const { data } = await apiClient.get('/config/anio-escolar');
    return data.data;
  },
  async getPeriodos() {
    const { data } = await apiClient.get('/config/periodos');
    return data.data;
  },
  async getRegimen() {
    const { data } = await apiClient.get('/config/regimen');
    return data.data;
  },
  async getAreas() {
    const { data } = await apiClient.get('/config/areas');
    return data.data;
  },
  async getSecciones() {
    const { data } = await apiClient.get('/config/secciones');
    return data.data;
  },
  async updateTenant(payload: any) {
    const { data } = await apiClient.patch('/config/tenant', payload);
    return data.data;
  },
};
