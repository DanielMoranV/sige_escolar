export const cierreRoutes = [
  {
    path: 'cierre',
    name: 'cierre-anio',
    component: () => import('../../views/cierre/CierreAnioView.vue'),
    meta: { requiresAuth: true, roles: ['DIRECTOR', 'SECRETARIA'] },
  },
];
