import apiClient from '../client';

export const estudiantesService = {
  async getEstudiantes(page: number = 1, limit: number = 20, search?: string) {
    const { data } = await apiClient.get('/estudiantes', {
      params: { page, limit, search },
    });
    return data;
  },
  async getEstudiante(id: string) {
    const { data } = await apiClient.get(`/estudiantes/${id}`);
    return data.data;
  },
  async validateDni(dni: string) {
    const { data } = await apiClient.get(`/estudiantes/validate-dni/${dni}`);
    return data.data;
  },
  async createEstudiante(payload: any) {
    const { data } = await apiClient.post('/estudiantes', payload);
    return data.data;
  },
  async updateEstudiante(id: string, payload: any) {
    const { data } = await apiClient.patch(`/estudiantes/${id}`, payload);
    return data.data;
  },
  async deleteEstudiante(id: string) {
    await apiClient.delete(`/estudiantes/${id}`);
  },
};
