<template>
  <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
    <div>
      <h1 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h1>
    </div>

    <div class="flex items-center gap-4">
      <!-- Filtro de nivel educativo -->
      <div v-if="nivelStore.nivelesDisponibles.length > 0" class="flex items-center gap-1.5">
        <template v-if="nivelStore.esFiltrable">
          <button
            v-for="opcion in opciones"
            :key="opcion.value"
            @click="nivelStore.setNivel(opcion.value)"
            :class="[
              'px-3 py-1 rounded-full text-xs font-semibold transition-all border',
              nivelStore.nivelActivo === opcion.value
                ? opcion.activeClass
                : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300 hover:text-gray-700',
            ]"
          >
            {{ opcion.label }}
          </button>
        </template>
        <template v-else>
          <!-- Solo un nivel: badge fijo sin interacción -->
          <span :class="['px-3 py-1 rounded-full text-xs font-semibold border', opcionDelNivel(nivelStore.nivelesDisponibles[0]).activeClass]">
            {{ opcionDelNivel(nivelStore.nivelesDisponibles[0]).label }}
          </span>
        </template>
      </div>

      <div v-if="authStore.user?.tenantName" class="flex flex-col items-end">
        <span class="text-xs font-semibold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">{{ authStore.user.tenantName }}</span>
        <span class="text-xs text-gray-500">{{ authStore.user?.email }}</span>
      </div>
      <span v-else class="text-sm text-gray-500">{{ authStore.user?.email }}</span>

      <button
        @click="showLogoutModal = true"
        class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Cerrar sesión"
      >
        <LogOutIcon class="w-5 h-5" />
      </button>
    </div>
  </header>

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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LogOutIcon } from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth.store';
import { useNivelStore } from '../../stores/nivel.store';
import { schoolConfigService } from '../../api/services/school-config.service';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const nivelStore = useNivelStore();
const showLogoutModal = ref(false);

async function handleLogout() {
  showLogoutModal.value = false;
  await authStore.logout();
  router.push('/login');
}

const NIVEL_CONFIG: Record<string, { label: string; activeClass: string }> = {
  TODOS:      { label: 'Todos',      activeClass: 'border-gray-400 text-gray-700 bg-gray-100' },
  INICIAL:    { label: 'Inicial',    activeClass: 'border-emerald-400 text-emerald-700 bg-emerald-50' },
  PRIMARIA:   { label: 'Primaria',   activeClass: 'border-blue-400 text-blue-700 bg-blue-50' },
  SECUNDARIA: { label: 'Secundaria', activeClass: 'border-purple-400 text-purple-700 bg-purple-50' },
};

function opcionDelNivel(nivel: string) {
  return NIVEL_CONFIG[nivel] ?? { label: nivel, activeClass: 'border-gray-400 text-gray-700 bg-gray-100' };
}

const opciones = computed(() => {
  const items = [{ value: 'TODOS', ...NIVEL_CONFIG.TODOS }];
  for (const n of nivelStore.nivelesDisponibles) {
    items.push({ value: n, ...opcionDelNivel(n) });
  }
  return items;
});

onMounted(async () => {
  if (nivelStore.nivelesDisponibles.length > 0) return; // ya inicializado
  try {
    const regimen = await schoolConfigService.getRegimen();
    const niveles = regimen.map((r: any) => r.nivel as string);
    nivelStore.init(niveles);
  } catch {
    // tenant sin configuración (ej: superadmin) — ignorar silenciosamente
  }
});

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

  if (titles[route.path]) return titles[route.path];

  for (const [path, title] of Object.entries(titles)) {
    if (route.path.startsWith(path)) return title;
  }

  return 'SIGE Escolar';
});
</script>
