export const authRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../../views/auth/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'auth' },
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('../../views/auth/ChangePasswordView.vue'),
    meta: { requiresAuth: true, layout: 'auth' },
  },
];
