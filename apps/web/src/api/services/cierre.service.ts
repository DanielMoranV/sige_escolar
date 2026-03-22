import apiClient from '../client';

export const cierreService = {
  async calcularCierre(anioEscolarId: string) {
    const { data } = await apiClient.post(`cierre/calcular/${anioEscolarId}`);
    return data.data;
  },
  async getResultado(anioEscolarId: string, seccionId?: string) {
    const params = seccionId ? { seccionId } : {};
    const { data } = await apiClient.get(`cierre/resultado/${anioEscolarId}`, { params });
    return data.data;
  },
  async setCasoEspecial(matriculaId: string, payload: { resultado: string, justificacion: string }) {
    const { data } = await apiClient.patch(`cierre/caso-especial/${matriculaId}`, payload);
    return data.data;
  },
  async exportExcel(anioEscolarId: string) {
    const response = await apiClient.post(`cierre/export/excel/${anioEscolarId}`, {}, {
      responseType: 'blob'
    });
    return response.data;
  }
};
