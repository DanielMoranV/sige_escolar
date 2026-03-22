import apiClient from '../client';

export const reportesService = {
  async getLibreta(matriculaId: string, periodoId: string) {
    const { data } = await apiClient.get(`reportes/libreta/${matriculaId}/${periodoId}`);
    return data.data;
  },
  async downloadLibretaPdf(matriculaId: string, periodoId: string) {
    const response = await apiClient.get(`reportes/libreta/${matriculaId}/${periodoId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },
  async getSeccionRendimiento(seccionId: string) {
    const { data } = await apiClient.get(`reportes/rendimiento/seccion/${seccionId}`);
    return data.data;
  },
  async descargarLibretasSeccion(seccionId: string, periodoId: string): Promise<Blob> {
    const response = await apiClient.get(`reportes/libretas/${seccionId}/${periodoId}/pdf`, { responseType: 'blob' });
    return response.data;
  },
  async getActaBorrador(seccionId: string) {
    const { data } = await apiClient.get(`reportes/acta-borrador/${seccionId}`);
    return data.data;
  },
};
