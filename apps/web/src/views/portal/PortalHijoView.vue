<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { portalService } from '@/api/services/portal.service';
import StatCard from '@/components/ui/StatCard.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import { 
  UserIcon, 
  GraduationCapIcon, 
  CalendarIcon, 
  ClipboardListIcon 
} from 'lucide-vue-next';

const hijo = ref<any>(null);
const asistencia = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const [hijoData, asistenciaData] = await Promise.all([
      portalService.getHijoResumen(),
      portalService.getAsistencia()
    ]);
    hijo.value = hijoData;
    asistencia.value = asistenciaData;
  } catch (error) {
    console.error('Error al cargar datos del hijo', error);
  } finally {
    loading.value = false;
  }
});

const getEstadoClass = (estado: string) => {
  switch (estado) {
    case 'PRESENTE': return 'success';
    case 'TARDANZA': return 'warning';
    case 'FALTA_INJUSTIFICADA': return 'danger';
    case 'FALTA_JUSTIFICADA': return 'info';
    default: return 'neutral';
  }
};
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="animate-pulse space-y-6">
      <div class="h-20 bg-gray-200 rounded-lg"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    </div>

    <div v-else-if="hijo" class="space-y-6">
      <!-- Encabezado Estudiante -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
        <div class="bg-primary-100 p-3 rounded-full">
          <UserIcon class="h-8 w-8 text-primary-600" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ hijo.apellido_paterno }} {{ hijo.apellido_materno }}, {{ hijo.nombres }}
          </h1>
          <p class="text-gray-500">
            {{ hijo.grado_nombre }} "{{ hijo.seccion_nombre }}" | Año Escolar
          </p>
        </div>
      </div>

      <!-- Métricas Rápidas -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Asistencias"
          :value="asistencia?.resumenMensual?.asistencias || 0"
          type="success"
          :icon="CalendarIcon"
        />
        <StatCard
          title="Inasistencias"
          :value="asistencia?.resumenMensual?.faltas_injustificadas || 0"
          type="danger"
          :icon="CalendarIcon"
        />
        <StatCard
          title="Tardanzas"
          :value="asistencia?.resumenMensual?.tardanzas || 0"
          type="warning"
          :icon="CalendarIcon"
        />
        <StatCard
          title="Rendimiento"
          value="Ver Notas"
          type="info"
          :icon="GraduationCapIcon"
          @click="$router.push('/portal/notas')"
          class="cursor-pointer hover:bg-blue-50 transition-colors"
        />
      </div>

      <!-- Historial de Asistencia Reciente -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-6 py-4 border-bottom border-gray-100 bg-gray-50">
          <h3 class="font-semibold text-gray-800">Asistencia Reciente</h3>
        </div>
        <div class="p-0">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observación</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="reg in asistencia?.historialReciente" :key="reg.fecha">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ new Date(reg.fecha).toLocaleDateString() }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <BaseBadge :type="getEstadoClass(reg.estado)">
                    {{ reg.estado.replace('_', ' ') }}
                  </BaseBadge>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ reg.observacion || '-' }}
                </td>
              </tr>
              <tr v-if="!asistencia?.historialReciente?.length">
                <td colspan="3" class="px-6 py-10 text-center text-gray-500">
                  No hay registros de asistencia recientes.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20 bg-white rounded-lg shadow-sm">
      <GraduationCapIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No se encontró información</h3>
      <p class="mt-1 text-sm text-gray-500">No tienes hijos asociados con matrícula activa.</p>
    </div>
  </div>
</template>
