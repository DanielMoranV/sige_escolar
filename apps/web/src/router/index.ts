import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { authRoutes } from './routes/auth.routes';
import { dashboardRoutes } from './routes/dashboard.routes';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    ...dashboardRoutes,
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
  if (to.path === '/login' && auth.isAuthenticated) {
    return next('/dashboard');
  }
  next();
});

export default router;
