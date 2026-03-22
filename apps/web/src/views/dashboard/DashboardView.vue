<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Bienvenido, {{ authStore.user?.nombres }}</h2>
      <p class="text-gray-500 text-sm mt-1">Panel de gestión escolar — {{ new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Lima' }) }}</p>
    </div>

    <!-- Stat Cards -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      <div v-for="i in 4" :key="i" class="bg-gray-100 h-24 rounded-xl border border-gray-200"></div>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        v-for="card in statCards"
        :key="card.label"
        :title="card.label"
        :value="card.value"
        :icon="card.icon"
        :color="card.color"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import { dashboardService } from '../../api/services/dashboard.service';
import { UsersIcon, LayoutGridIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-vue-next';
import StatCard from '../../components/ui/StatCard.vue';

const authStore = useAuthStore();
const loading = ref(true);
const stats = ref({
  totalEstudiantes: 0,
  totalSecciones: 0,
  asistenciaHoy: 0,
  alertasActivas: 0
});

const statCards = computed(() => [
  { label: 'Estudiantes', value: stats.value.totalEstudiantes, icon: UsersIcon, color: 'blue' as const },
  { label: 'Secciones', value: stats.value.totalSecciones, icon: LayoutGridIcon, color: 'green' as const },
  { label: 'Asistencia hoy', value: stats.value.asistenciaHoy, icon: CheckCircleIcon, color: 'yellow' as const },
  { label: 'Alertas activas', value: stats.value.alertasActivas, icon: AlertCircleIcon, color: 'red' as const },
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
