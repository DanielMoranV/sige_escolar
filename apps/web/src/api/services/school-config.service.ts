import apiClient from '../client';

export const schoolConfigService = {
  async getAnioEscolar() {
    const { data } = await apiClient.get('config/anio-escolar');
    return data.data;
  },
  async getPeriodos() {
    const { data } = await apiClient.get('config/periodos');
    return data.data;
  },
  async getRegimen() {
    const { data } = await apiClient.get('config/regimen');
    return data.data;
  },
  async getAreas() {
    const { data } = await apiClient.get('config/areas');
    return data.data;
  },
  async getSecciones() {
    const { data } = await apiClient.get('config/secciones');
    return data.data;
  },
  async getAllSecciones() {
    const { data } = await apiClient.get('config/secciones/all');
    return data.data;
  },
  async getGrados() {
    const { data } = await apiClient.get('config/grados');
    return data.data;
  },
  async createSeccion(payload: any) {
    const { data } = await apiClient.post('config/secciones', payload);
    return data.data;
  },
  async updateSeccion(id: string, payload: any) {
    const { data } = await apiClient.patch(`config/secciones/${id}`, payload);
    return data.data;
  },
  async getAllAreas() {
    const { data } = await apiClient.get('config/areas/all');
    return data.data;
  },
  async createArea(payload: any) {
    const { data } = await apiClient.post('config/areas', payload);
    return data.data;
  },
  async updateArea(id: string, payload: any) {
    const { data } = await apiClient.patch(`config/areas/${id}`, payload);
    return data.data;
  },
  async getCompetencias(areaId: string) {
    const { data } = await apiClient.get(`config/areas/${areaId}/competencias`);
    return data.data;
  },
  async createCompetencia(payload: any) {
    const { data } = await apiClient.post('config/competencias', payload);
    return data.data;
  },
  async updateCompetencia(id: string, payload: any) {
    const { data } = await apiClient.patch(`config/competencias/${id}`, payload);
    return data.data;
  },
  async getConfigAsistencia() {
    const { data } = await apiClient.get('config/asistencia');
    return data.data;
  },
  async updateConfigAsistencia(payload: any) {
    const { data } = await apiClient.patch('config/asistencia', payload);
    return data.data;
  },
  async updateTenant(payload: any) {
    const { data } = await apiClient.patch('config/tenant', payload);
    return data.data;
  },
};
