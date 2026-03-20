import apiClient from '../client';

export interface CreateSuperadminPayload {
  email: string;
  nombres: string;
  apellidos: string;
  password: string;
}

export const superadminsService = {
  async getSuperadmins() {
    const { data } = await apiClient.get('/superadmins');
    return data.data ?? data;
  },

  async createSuperadmin(payload: CreateSuperadminPayload) {
    const { data } = await apiClient.post('/superadmins', payload);
    return data.data ?? data;
  },

  async deleteSuperadmin(id: string) {
    const { data } = await apiClient.delete(`/superadmins/${id}`);
    return data.data ?? data;
  },
};
