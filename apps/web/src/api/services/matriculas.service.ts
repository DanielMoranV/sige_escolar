import apiClient from '../client';

export const matriculasService = {
  async getMatriculas(anioEscolarId: string, page: number = 1, limit: number = 20, filters?: any) {
    const cleanFilters = filters
      ? Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined))
      : {};
    const { data } = await apiClient.get('matriculas', {
      params: { anioEscolarId, page, limit, ...cleanFilters },
    });
    return data;
  },
  async getMatricula(id: string) {
    const { data } = await apiClient.get(`matriculas/${id}`);
    return data.data;
  },
  async createMatricula(payload: any) {
    const { data } = await apiClient.post('matriculas', payload);
    return data.data;
  },
  async updateMatricula(id: string, payload: any) {
    const { data } = await apiClient.patch(`matriculas/${id}`, payload);
    return data.data;
  },
  async retirar(id: string, payload: { fechaRetiro: string; motivo: string }) {
    const { data } = await apiClient.post(`matriculas/${id}/retirar`, payload);
    return data.data;
  },
};
