export const matriculasRoutes = [
  {
    path: '/matriculas',
    name: 'matriculas-list',
    component: () => import('../../views/matriculas/MatriculasListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/matriculas/nueva',
    name: 'matricula-create',
    component: () => import('../../views/matriculas/MatriculaCreateView.vue'),
    meta: { requiresAuth: true },
  },
];
