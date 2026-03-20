import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { authRoutes } from './routes/auth.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { configRoutes } from './routes/config.routes';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    ...dashboardRoutes,
    ...configRoutes,
    { path: '/', redirect: '/dashboard' },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  const requiresAuth = to.meta.requiresAuth !== false;

  if (requiresAuth && !auth.isAuthenticated) {
    return next('/login');
  }

  // Si requiere cambio de contraseña y no está en la página de cambio
  if (auth.isAuthenticated && auth.mustChangePassword && to.path !== '/change-password') {
    return next('/change-password');
  }

  // Si ya cambió la contraseña e intenta entrar a /change-password
  if (auth.isAuthenticated && !auth.mustChangePassword && to.path === '/change-password') {
    return next('/dashboard');
  }

  // Verificar roles si existen en meta
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.rol)) {
    return next('/dashboard');
  }

  if (to.path === '/login' && auth.isAuthenticated) {
    return next('/dashboard');
  }
  next();
});

export default router;
