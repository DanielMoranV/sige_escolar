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
      <span v-if="!uiStore.sidebarCollapsed" class="text-white font-bold text-lg truncate">SIGE</span>
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
    <nav class="flex-1 py-4 px-2 overflow-y-auto space-y-0.5">
      <template v-for="item in menuItems" :key="item.type === 'separator' ? item.label : item.path">
        <!-- Separador de sección -->
        <div v-if="item.type === 'separator'" class="pt-4 pb-1 px-2">
          <span
            v-if="!uiStore.sidebarCollapsed"
            class="text-[10px] font-bold tracking-widest uppercase text-blue-400"
          >{{ item.label }}</span>
          <div v-else class="border-t border-blue-800 mt-1"></div>
        </div>
        <!-- Item de navegación -->
        <SidebarItem v-else :item="item" :collapsed="uiStore.sidebarCollapsed" />
      </template>
    </nav>

    <!-- User info + logout -->
    <div class="border-t border-blue-800 p-3">
      <div v-if="!uiStore.sidebarCollapsed" class="mb-2 px-2">
        <p class="text-blue-100 text-sm font-medium truncate">{{ authStore.fullName }}</p>
        <p class="text-blue-300 text-xs">{{ formatRol(authStore.user?.rol) }}</p>
      </div>
      <button
        @click="showLogoutModal = true"
        class="flex items-center gap-2 w-full px-2 py-2 rounded text-blue-200 hover:text-white hover:bg-blue-800 transition-colors"
        :title="uiStore.sidebarCollapsed ? 'Cerrar sesión' : undefined"
      >
        <LogOutIcon class="w-5 h-5 shrink-0" />
        <span v-if="!uiStore.sidebarCollapsed" class="text-sm">Cerrar sesión</span>
      </button>
    </div>
  </aside>

  <BaseModal :show="showLogoutModal" title="Cerrar sesión" @close="showLogoutModal = false">
    <p class="text-sm text-gray-600">¿Está seguro de que desea cerrar la sesión?</p>
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="secondary" @click="showLogoutModal = false">Cancelar</BaseButton>
        <BaseButton variant="danger" @click="handleLogout">Cerrar sesión</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import SidebarItem from './SidebarItem.vue';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
  UserPlusIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  FileTextIcon,
  ArchiveIcon,
  UploadCloudIcon,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const uiStore = useUiStore();
const router = useRouter();
const showLogoutModal = ref(false);

const menuItems = computed(() => {
  if (authStore.user?.rol === 'APODERADO') {
    return [
      { label: 'Mi Hijo', path: '/portal', icon: UsersIcon },
      { label: 'Notas', path: '/portal/notas', icon: GraduationCapIcon },
      { label: 'Libretas', path: '/portal/libretas', icon: FileTextIcon },
    ];
  }

  const items: any[] = [
    { type: 'separator', label: 'General' },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboardIcon },
    { label: 'Estudiantes', path: '/estudiantes', icon: UsersIcon },
    { label: 'Matrículas', path: '/matriculas', icon: UserPlusIcon },
    { type: 'separator', label: 'Académico' },
    { label: 'Asistencia', path: '/asistencia', icon: CheckCircleIcon },
    { label: 'Notas', path: '/notas', icon: GraduationCapIcon },
    { label: 'Reportes', path: '/reportes', icon: FileTextIcon },
  ];

  if (authStore.user?.rol === 'DIRECTOR' || authStore.user?.rol === 'SUPER_ADMIN') {
    items.push({ type: 'separator', label: 'Dirección' });
    items.push({ label: 'SIAGIE', path: '/siagie', icon: UploadCloudIcon });
    items.push({ label: 'Cierre de Año', path: '/cierre', icon: ArchiveIcon });
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
  showLogoutModal.value = false;
  await authStore.logout();
  router.push('/login');
}
</script>
