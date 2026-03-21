import { RouteRecordRaw } from 'vue-router';
import DashboardLayout from '@/layouts/DashboardLayout.vue';

export const portalRoutes: RouteRecordRaw[] = [
  {
    path: '/portal',
    component: DashboardLayout,
    meta: { requiresAuth: true, role: 'APODERADO' },
    children: [
      {
        path: '',
        name: 'portal-hijo',
        component: () => import('@/views/portal/PortalHijoView.vue'),
        meta: { title: 'Mi Hijo' }
      },
      {
        path: 'notas',
        name: 'portal-notas',
        component: () => import('@/views/portal/PortalNotasView.vue'),
        meta: { title: 'Notas' }
      },
      {
        path: 'libretas',
        name: 'portal-libretas',
        component: () => import('@/views/portal/PortalLibretasView.vue'),
        meta: { title: 'Libretas' }
      }
    ]
  }
];
