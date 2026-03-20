export const superadminsRoutes = [
  {
    path: '/superadmins',
    component: () => import('../../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'superadmins',
        component: () => import('../../views/superadmins/SuperAdminsView.vue'),
      },
    ],
  },
];
