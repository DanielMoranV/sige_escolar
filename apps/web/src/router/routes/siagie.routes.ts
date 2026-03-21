export const siagieRoutes = [
  {
    path: 'siagie',
    name: 'siagie-panel',
    component: () => import('../../views/siagie/SiagieView.vue'),
    meta: { requiresAuth: true, roles: ['DIRECTOR', 'SECRETARIA'] },
  },
];
