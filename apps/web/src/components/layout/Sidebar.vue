<template>
  <aside
    class="flex flex-col h-full transition-all duration-300 overflow-hidden shrink-0"
    :style="{
      width: uiStore.sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      backgroundColor: 'var(--sidebar-bg)',
    }"
  >
    <!-- Brand -->
    <div class="flex items-center justify-between px-4 py-4 border-b border-blue-800">
      <span
        v-if="!uiStore.sidebarCollapsed"
        class="text-white font-bold text-lg truncate"
      >SIGE</span>
      <button
        @click="uiStore.toggleSidebar()"
        class="text-blue-200 hover:text-white p-1 rounded transition-colors ml-auto"
        :title="uiStore.sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'"
      >
        <ChevronLeftIcon v-if="!uiStore.sidebarCollapsed" class="w-5 h-5" />
        <ChevronRightIcon v-else class="w-5 h-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
      <SidebarItem
        v-for="item in menuItems"
        :key="item.path"
        :item="item"
        :collapsed="uiStore.sidebarCollapsed"
      />
    </nav>

    <!-- User info + logout -->
    <div class="border-t border-blue-800 p-3">
      <div v-if="!uiStore.sidebarCollapsed" class="mb-2 px-2">
        <p class="text-blue-100 text-sm font-medium truncate">{{ authStore.fullName }}</p>
        <p class="text-blue-300 text-xs">{{ formatRol(authStore.user?.rol) }}</p>
      </div>
      <button
        @click="handleLogout"
        class="flex items-center gap-2 w-full px-2 py-2 rounded text-blue-200 hover:text-white hover:bg-blue-800 transition-colors"
        :title="uiStore.sidebarCollapsed ? 'Cerrar sesión' : undefined"
      >
        <LogOutIcon class="w-5 h-5 shrink-0" />
        <span v-if="!uiStore.sidebarCollapsed" class="text-sm">Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  LogOutIcon, 
  LayoutDashboardIcon,
  SettingsIcon
} from 'lucide-vue-next';

const authStore = useAuthStore();
const uiStore = useUiStore();
const router = useRouter();

const menuItems = computed(() => {
  const items = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboardIcon },
  ];

  if (authStore.user?.rol === 'DIRECTOR' || authStore.user?.rol === 'SUPER_ADMIN') {
    items.push({ label: 'Configuración', path: '/configuracion', icon: SettingsIcon });
  }

  return items;
});

function formatRol(rol?: string): string {
  const mapa: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    DIRECTOR: 'Director(a)',
    SUBDIRECTOR: 'Subdirector(a)',
    DOCENTE_TUTOR: 'Docente Tutor',
    DOCENTE_AREA: 'Docente de Área',
    SECRETARIA: 'Secretaria',
    APODERADO: 'Apoderado',
    ESTUDIANTE: 'Estudiante',
  };
  return mapa[rol ?? ''] ?? rol ?? '';
}

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>
