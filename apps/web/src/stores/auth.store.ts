import { defineStore } from 'pinia';
import { authService } from '../api/services/auth.service';

interface AuthUser {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: string;
  tenantId: string | null;
  needsPasswordChange?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    isSuperAdmin: (state) => state.user?.rol === 'SUPER_ADMIN',
    isDirector: (state) => state.user?.rol === 'DIRECTOR',
    fullName: (state) => state.user ? `${state.user.nombres} ${state.user.apellidos}` : '',
    mustChangePassword: (state) => state.user?.needsPasswordChange === true,
  },
  actions: {
    async login(email: string, password: string) {
      const result = await authService.login(email, password);
      this.accessToken = result.accessToken;
      this.refreshToken = result.refreshToken;
      this.user = result.user;
    },
    async logout() {
      try { await authService.logout(); } catch {}
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
    },
    async refreshTokens() {
      if (!this.refreshToken || !this.user) throw new Error('No refresh token');
      const result = await authService.refreshToken(this.user.id, this.refreshToken);
      this.accessToken = result.accessToken;
    },
    async changePassword(current: string, newPass: string) {
      await authService.changePassword(current, newPass);
      if (this.user) {
        this.user.needsPasswordChange = false;
      }
    },
  },
  persist: true,
});
