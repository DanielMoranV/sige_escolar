import apiClient from '../client';

export const docentesService = {
  async getAll() {
    const { data } = await apiClient.get('docentes');
    return data.data;
  },

  async getAsignaciones(docenteId: string) {
    const { data } = await apiClient.get(`docentes/${docenteId}/asignaciones`);
    return data.data;
  },

  async create(payload: any) {
    const { data } = await apiClient.post('docentes', payload);
    return data.data;
  },

  async update(id: string, payload: any) {
    const { data } = await apiClient.patch(`docentes/${id}`, payload);
    return data.data;
  },

  async asignar(payload: any) {
    const { data } = await apiClient.post('docentes/asignaciones', payload);
    return data.data;
  },

  async removeAsignacion(id: string) {
    await apiClient.delete(`docentes/asignaciones/${id}`);
  },

  async getMisAsignaciones() {
    const { data } = await apiClient.get('docentes/mis-asignaciones');
    return data.data;
  },
};
