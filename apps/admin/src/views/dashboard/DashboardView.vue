<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Panel de Control</h1>
      <p class="text-gray-500 mt-1">Resumen del sistema SIGE Escolar.</p>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <!-- Skeleton while loading -->
      <template v-if="isPending">
        <div
          v-for="n in 4"
          :key="`sk-${n}`"
          class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-gray-200 rounded-xl" />
            <div class="flex-1 space-y-2 mt-1">
              <div class="h-3 bg-gray-200 rounded w-3/4" />
              <div class="h-7 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="data">
        <StatCard
          title="Colegios Activos"
          :value="data.totalColegiosActivos"
          :icon="Building2Icon"
          color="green"
        />
        <StatCard
          title="Colegios Inactivos"
          :value="data.totalColegiosInactivos"
          :icon="BuildingIcon"
          color="yellow"
        />
        <StatCard
          title="Total Usuarios"
          :value="data.totalUsuarios"
          :icon="UsersIcon"
          color="blue"
        />
        <StatCard
          title="Último Acceso"
          :value="formatDate(data.ultimoAcceso)"
          :icon="ClockIcon"
          color="blue"
        />
      </template>
    </div>

    <!-- Error state -->
    <div v-if="isError" class="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
      Error al cargar los datos del dashboard. Intente recargar la página.
    </div>

    <!-- Quick actions -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-base font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
      <div class="flex flex-wrap gap-3">
        <RouterLink
          to="/tenants/crear"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon class="w-4 h-4" />
          Nuevo colegio
        </RouterLink>
        <RouterLink
          to="/tenants"
          class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <Building2Icon class="w-4 h-4" />
          Ver colegios
        </RouterLink>
        <RouterLink
          to="/superadmins"
          class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <UserCogIcon class="w-4 h-4" />
          Gestionar superadmins
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { Building2Icon, BuildingIcon, UsersIcon, ClockIcon, PlusIcon, UserCogIcon } from 'lucide-vue-next';
import { dashboardService } from '../../api/services/dashboard.service';
import StatCard from '../../components/ui/StatCard.vue';

const { data, isPending, isError } = useQuery({
  queryKey: ['dashboard'],
  queryFn: () => dashboardService.getDashboard(),
  staleTime: 60_000,
});

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
</script>
