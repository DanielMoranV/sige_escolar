export const docentesRoutes = [
  {
    path: 'docentes',
    name: 'docentes',
    component: () => import('../../views/docentes/DocentesView.vue'),
    meta: { requiresAuth: true, roles: ['DIRECTOR', 'SUPER_ADMIN'] },
  },
];
