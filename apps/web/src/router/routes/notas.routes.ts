export const notasRoutes = [
  {
    path: 'notas',
    name: 'notas-seccion',
    component: () => import('../../views/notas/NotasSeccionView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'notas/exportar',
    name: 'notas-exportar',
    component: () => import('../../views/notas/NotasExportView.vue'),
    meta: { requiresAuth: true, roles: ['DIRECTOR'] },
  },
];
