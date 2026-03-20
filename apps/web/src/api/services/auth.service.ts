import apiClient from '../client';

export const authService = {
  async login(email: string, password: string) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data.data;
  },
  async logout() {
    await apiClient.post('/auth/logout');
  },
  async me() {
    const { data } = await apiClient.get('/auth/me');
    return data.data;
  },
};
