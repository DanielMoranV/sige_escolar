<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Bienvenido, {{ authStore.user?.nombres }}</h2>
      <p class="text-gray-500 text-sm mt-1">Panel de gestión escolar — {{ new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
    </div>

    <!-- Stat Cards -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      <div v-for="i in 4" :key="i" class="bg-gray-100 h-24 rounded-xl border border-gray-200"></div>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="card in statCards" :key="card.label" class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500 font-medium">{{ card.label }}</p>
          <component :is="card.icon" class="w-4 h-4 text-gray-400" />
        </div>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ card.value }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import { dashboardService } from '../../api/services/dashboard.service';
import { UsersIcon, LayoutGridIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-vue-next';

const authStore = useAuthStore();
const loading = ref(true);
const stats = ref({
  totalEstudiantes: 0,
  totalSecciones: 0,
  asistenciaHoy: 0,
  alertasActivas: 0
});

const statCards = computed(() => [
  { label: 'Estudiantes', value: stats.value.totalEstudiantes, icon: UsersIcon },
  { label: 'Secciones', value: stats.value.totalSecciones, icon: LayoutGridIcon },
  { label: 'Asistencia hoy', value: stats.value.asistenciaHoy, icon: CheckCircleIcon },
  { label: 'Alertas activas', value: stats.value.alertasActivas, icon: AlertCircleIcon },
]);

onMounted(async () => {
  try {
    const data = await dashboardService.getStats();
    stats.value = data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  } finally {
    loading.value = false;
  }
});
</script>
