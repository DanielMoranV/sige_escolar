export const docentesRoutes = [
  {
    path: 'docentes',
    name: 'docentes',
    component: () => import('../../views/docentes/DocentesView.vue'),
    meta: { requiresAuth: true, roles: ['DIRECTOR', 'SUPER_ADMIN'] },
  },
  {
    path: 'mis-secciones',
    name: 'mis-secciones',
    component: () => import('../../views/docentes/MisSeccionesView.vue'),
    meta: { requiresAuth: true, roles: ['DOCENTE_TUTOR', 'DOCENTE_AREA', 'DIRECTOR', 'SUPER_ADMIN'] },
  },
];
