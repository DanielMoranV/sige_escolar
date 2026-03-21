export const asistenciaRoutes = [
  {
    path: '/asistencia',
    name: 'asistencia-diaria',
    component: () => import('../../views/asistencia/AsistenciaDiariaView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/asistencia/alertas',
    name: 'asistencia-alertas',
    component: () => import('../../views/asistencia/AlertasView.vue'),
    meta: { requiresAuth: true, roles: ['DIRECTOR'] },
  },
  {
    path: '/asistencia/exportar',
    name: 'asistencia-exportar',
    component: () => import('../../views/asistencia/AsistenciaExportView.vue'),
    meta: { requiresAuth: true, roles: ['DIRECTOR'] },
  },
];
