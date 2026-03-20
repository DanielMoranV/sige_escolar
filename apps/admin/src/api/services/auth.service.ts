import axios from 'axios';
import apiClient from '../client';

// Cliente separado para auth (no usa el prefijo /admin)
const authClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const authService = {
  async login(email: string, password: string) {
    const { data } = await authClient.post('/auth/login', { email, password });
    return data.data;
  },
  async logout() {
    try { await apiClient.post('/auth/logout'); } catch {}
  },
  async me() {
    const { data } = await apiClient.get('/auth/me');
    return data.data;
  },
};
