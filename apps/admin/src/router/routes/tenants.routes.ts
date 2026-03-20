export const tenantsRoutes = [
  {
    path: '/tenants',
    component: () => import('../../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'tenants-list',
        component: () => import('../../views/tenants/TenantsListView.vue'),
      },
      {
        path: 'crear',
        name: 'tenants-create',
        component: () => import('../../views/tenants/TenantCreateView.vue'),
      },
      {
        path: ':id',
        name: 'tenant-detail',
        component: () => import('../../views/tenants/TenantDetailView.vue'),
      },
      {
        path: ':id/editar',
        name: 'tenant-edit',
        component: () => import('../../views/tenants/TenantEditView.vue'),
      },
    ],
  },
];
