import apiClient from '../client';

export const asistenciaService = {
  async getSeccionAsistencia(seccionId: string, fecha: string) {
    const { data } = await apiClient.get(`asistencia/seccion/${seccionId}/${fecha}`);
    return data.data;
  },
  async registerBulk(seccionId: string, fecha: string, items: any[]) {
    const { data } = await apiClient.post(`asistencia/seccion/${seccionId}/${fecha}`, { items });
    return data.data;
  },
  async getJustificacionesPendientes() {
    const { data } = await apiClient.get('asistencia/justificaciones/pendientes');
    return data.data;
  },
  async reviewJustificacion(id: string, payload: any) {
    const { data } = await apiClient.patch(`asistencia/justificaciones/${id}/revisar`, payload);
    return data.data;
  },
  async getAlertas() {
    const { data } = await apiClient.get('asistencia/alertas');
    return data.data;
  },
  async calcularAlertas(anioEscolarId: string) {
    const { data } = await apiClient.post('asistencia/calcular-alertas', { anioEscolarId });
    return data.data;
  },
  async exportSiagie(params: { mes: number; anioEscolarId: string; seccionId?: string }) {
    const { data } = await apiClient.get('asistencia/export/siagie', { params });
    return data.data;
  },
};
