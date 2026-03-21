export const configRoutes = [
  {
    path: 'configuracion',
    name: 'configuracion',
    component: () => import('../../views/config/ConfiguracionView.vue'),
    meta: { requiresAuth: true, roles: ['DIRECTOR', 'SUPER_ADMIN'] },
  },
  {
    path: 'aulas',
    redirect: '/configuracion',
  },
];
