import axios from 'axios';
import { useAuthStore } from '../../stores/auth.store';

// Uses a direct axios call to the full base URL (not admin-prefixed client)
const authApiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

authApiClient.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

export const dashboardService = {
  async getDashboard() {
    const { data } = await authApiClient.get('/admin/dashboard');
    return data.data ?? data;
  },
};
