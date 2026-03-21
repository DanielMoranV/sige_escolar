import apiClient from '../client';

export const dashboardService = {
  async getStats() {
    const { data } = await apiClient.get('dashboard-escolar/stats');
    return data.data;
  },
};
