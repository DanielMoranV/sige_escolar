export const authRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../../views/auth/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'auth' },
  },
];
