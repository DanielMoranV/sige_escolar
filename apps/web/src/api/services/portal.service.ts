import apiClient from '../client';

export const portalService = {
  async getHijoResumen() {
    const { data } = await apiClient.get('portal/hijo');
    return data.data;
  },
  async getNotas(periodoId: string) {
    const { data } = await apiClient.get(`portal/notas/${periodoId}`);
    return data.data;
  },
  async getAsistencia() {
    const { data } = await apiClient.get('portal/asistencia');
    return data.data;
  },
  async getLibretas() {
    const { data } = await apiClient.get('portal/libretas');
    return data.data;
  },
  async downloadLibreta(matriculaId: string, periodoId: string) {
    const response = await apiClient.get(`reportes/libreta/${matriculaId}/${periodoId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
