export const dashboardRoutes = [
  {
    path: '/dashboard',
    component: () => import('../../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('../../views/dashboard/DashboardView.vue'),
      },
    ],
  },
];
