export const reportesRoutes = [
  {
    path: '/reportes',
    name: 'reportes',
    component: () => import('../../views/reportes/ReportesView.vue'),
    meta: { requiresAuth: true, roles: ['DIRECTOR', 'SECRETARIA', 'DOCENTE_TUTOR'] },
  },
];
