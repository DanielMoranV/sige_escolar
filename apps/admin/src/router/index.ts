import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { authRoutes } from './routes/auth.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { tenantsRoutes } from './routes/tenants.routes';
import { superadminsRoutes } from './routes/superadmins.routes';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    ...dashboardRoutes,
    ...tenantsRoutes,
    ...superadminsRoutes,
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

  if (requiresAuth && auth.user?.rol !== 'SUPER_ADMIN') {
    // This is an admin SPA — all protected routes require SUPER_ADMIN
    auth.logout();
    return next('/login');
  }

  if (to.path === '/login' && auth.isAuthenticated) {
    return next('/dashboard');
  }

  next();
});

export default router;
