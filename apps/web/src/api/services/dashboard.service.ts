import apiClient from '../client';

export const dashboardService = {
  async getStats() {
    const { data } = await apiClient.get('/dashboard/stats');
    return data.data;
  },
};
