export const cierreRoutes = [
  {
    path: 'cierre',
    name: 'cierre-anio',
    component: () => import('../../views/cierre/CierreAnioView.vue'),
    meta: { requiresAuth: true, roles: ['DIRECTOR', 'SECRETARIA'] },
  },
  {
    path: 'cierre/recuperacion',
    name: 'cierre-recuperacion',
    component: () => import('../../views/cierre/RecuperacionView.vue'),
    meta: { requiresAuth: true, roles: ['DIRECTOR', 'SECRETARIA'] },
  },
];
