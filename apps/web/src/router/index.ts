import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { authRoutes } from './routes/auth.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { configRoutes } from './routes/config.routes';
import { estudiantesRoutes } from './routes/estudiantes.routes';
import { matriculasRoutes } from './routes/matriculas.routes';
import { asistenciaRoutes } from './routes/asistencia.routes';
import { notasRoutes } from './routes/notas.routes';
import { reportesRoutes } from './routes/reportes.routes';
import { cierreRoutes } from './routes/cierre.routes';
import { siagieRoutes } from './routes/siagie.routes';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    {
      path: '/',
      component: () => import('../layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/dashboard/DashboardView.vue'),
        },
        ...configRoutes,
        ...estudiantesRoutes,
        ...matriculasRoutes,
        ...asistenciaRoutes,
        ...notasRoutes,
        ...reportesRoutes,
        ...cierreRoutes,
        ...siagieRoutes,
      ],
    },
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
  const roles = to.meta.roles as string[] | undefined;
  if (roles && !roles.includes(auth.user?.rol || '')) {
    return next('/dashboard');
  }

  if (to.path === '/login' && auth.isAuthenticated) {
    return next('/dashboard');
  }
  next();
});

export default router;
