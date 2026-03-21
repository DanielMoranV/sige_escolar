export const estudiantesRoutes = [
  {
    path: 'estudiantes',
    name: 'estudiantes-list',
    component: () => import('../../views/estudiantes/EstudiantesListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'estudiantes/nuevo',
    name: 'estudiante-create',
    component: () => import('../../views/estudiantes/EstudianteCreateView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'estudiantes/:id',
    name: 'estudiante-detail',
    component: () => import('../../views/estudiantes/EstudianteDetailView.vue'),
    meta: { requiresAuth: true },
  },
];
