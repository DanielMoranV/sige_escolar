export const asistenciaRoutes = [
  {
    path: 'asistencia',
    name: 'asistencia-diaria',
    component: () => import('../../views/asistencia/AsistenciaDiariaView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'asistencia/alertas',
    redirect: '/asistencia',
  },
  {
    path: 'asistencia/exportar',
    redirect: '/siagie',
  },
];
