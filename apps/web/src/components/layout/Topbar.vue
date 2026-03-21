<template>
  <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
    <div>
      <h1 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h1>
    </div>
    <div class="flex items-center gap-4">
      <div v-if="authStore.user?.tenantName" class="flex flex-col items-end">
        <span class="text-xs font-semibold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">{{ authStore.user.tenantName }}</span>
        <span class="text-xs text-gray-500">{{ authStore.user?.email }}</span>
      </div>
      <span v-else class="text-sm text-gray-500">{{ authStore.user?.email }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';

const route = useRoute();
const authStore = useAuthStore();

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/estudiantes': 'Gestión de Estudiantes',
    '/matriculas': 'Matrículas y Traslados',
    '/configuracion': 'Configuración del Colegio',
    '/asistencia': 'Control de Asistencia',
    '/perfil': 'Mi Perfil',
    '/cambiar-password': 'Cambiar Contraseña',
  };
  
  // Try exact match first
  if (titles[route.path]) return titles[route.path];
  
  // Try prefix match for nested routes
  for (const [path, title] of Object.entries(titles)) {
    if (route.path.startsWith(path)) return title;
  }

  return 'SIGE Escolar';
});
</script>
