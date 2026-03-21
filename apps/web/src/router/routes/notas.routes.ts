export const notasRoutes = [
  {
    path: 'notas',
    name: 'notas-seccion',
    component: () => import('../../views/notas/NotasSeccionView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'notas/exportar',
    redirect: '/siagie',
  },
];
