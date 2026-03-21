/// <reference types="vite/client" />
import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const apiClient = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  // Extraer slug del subdominio (ej: esther_carson.sige.edu.pe -> esther_carson)
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  if (parts.length >= 3) {
    const slug = parts[0];
    if (slug !== 'admin' && slug !== 'www') {
      config.headers['x-tenant-slug'] = slug;
    }
  } else if (auth.user?.tenantSlug) {
    config.headers['x-tenant-slug'] = auth.user.tenantSlug;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const auth = useAuthStore();
      try {
        await auth.refreshTokens();
        originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        auth.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
