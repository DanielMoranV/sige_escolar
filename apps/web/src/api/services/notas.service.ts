import apiClient from '../client';

export const notasService = {
  async getGrilla(params: { seccionId: string; periodoId: string; areaId: string }) {
    const { data } = await apiClient.get('/notas/grilla', { params });
    return data.data;
  },
  async saveGrilla(payload: { periodoId: string; notas: any[] }) {
    const { data } = await apiClient.post('/notas/grilla', payload);
    return data.data;
  },
  async getEstudianteNotas(matriculaId: string) {
    const { data } = await apiClient.get(`/notas/estudiante/${matriculaId}`);
    return data.data;
  },
  async cerrarPeriodo(payload: { periodoId: string; seccionId: string }) {
    const { data } = await apiClient.post('/notas/cerrar-periodo', payload);
    return data.data;
  },
  async exportSiagie(params: { periodoId: string; seccionId: string }) {
    const { data } = await apiClient.get('/notas/export/siagie', { params });
    return data.data;
  },
};
