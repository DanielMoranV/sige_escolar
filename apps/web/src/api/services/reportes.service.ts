import apiClient from '../client';

export const reportesService = {
  async getLibreta(matriculaId: string, periodoId: string) {
    const { data } = await apiClient.get(`reportes/libreta/${matriculaId}/${periodoId}`);
    return data.data;
  },
  async getSeccionRendimiento(seccionId: string) {
    const { data } = await apiClient.get(`reportes/rendimiento/seccion/${seccionId}`);
    return data.data;
  },
};
