<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Alertas de Asistencia</h1>
        <p class="text-gray-500 mt-1">Estudiantes en riesgo por inasistencias injustificadas acumuladas.</p>
      </div>
      <BaseButton :loading="isRecalculating" @click="handleRecalculate">
        <RefreshCwIcon class="w-4 h-4" />
        Recalcular Alertas
      </BaseButton>
    </div>

    <div v-if="isLoading" class="p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-500">Cargando alertas...</p>
    </div>

    <div v-else-if="!alertas.length" class="bg-white p-12 rounded-xl border border-gray-200 text-center">
      <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircleIcon class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-gray-900">¡Todo en orden!</h3>
      <p class="text-gray-500 max-w-sm mx-auto">No se han detectado estudiantes que superen los umbrales de inasistencia.</p>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <BaseTable
        :columns="columns"
        :data="alertas"
      >
        <template #cell-estudiante="{ row }">
          <div class="flex flex-col">
            <span class="font-medium text-gray-900">{{ row.apellido_paterno }}, {{ row.nombres }}</span>
            <span class="text-xs text-gray-500">{{ row.grado }} - {{ row.seccion }}</span>
          </div>
        </template>

        <template #cell-nivel_alerta="{ row }">
          <BaseBadge :variant="getNivelVariant(row.nivel_alerta)">
            {{ row.nivel_alerta }}
          </BaseBadge>
        </template>

        <template #cell-porcentaje_asistencia="{ row }">
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
              <div 
                class="h-full rounded-full" 
                :class="getPorcentajeClass(row.porcentaje_asistencia)"
                :style="{ width: `${row.porcentaje_asistencia}%` }"
              ></div>
            </div>
            <span class="text-sm font-semibold" :class="getPorcentajeTextClass(row.porcentaje_asistencia)">
              {{ row.porcentaje_asistencia }}%
            </span>
          </div>
        </template>

        <template #cell-detalle="{ row }">
          <span class="text-xs text-gray-600">
            {{ row.faltas_injustificadas }} faltas • {{ row.tardanzas_acumuladas }} tardanzas
          </span>
        </template>

        <template #actions="{ row }">
          <BaseButton variant="secondary" size="sm" @click="verDetalle(row)">
            Ver Detalle
          </BaseButton>
        </template>
      </BaseTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { RefreshCwIcon, CheckCircleIcon } from 'lucide-vue-next';
import { asistenciaService } from '../../api/services/asistencia.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseTable from '../../components/ui/BaseTable.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';

const toast = useToast();

const router = useRouter();
const alertas = ref<any[]>([]);
const isLoading = ref(true);
const isRecalculating = ref(false);

const columns = [
  { key: 'estudiante', label: 'Estudiante' },
  { key: 'nivel_alerta', label: 'Nivel Riesgo' },
  { key: 'porcentaje_asistencia', label: '% Asistencia' },
  { key: 'detalle', label: 'Resumen' },
];

onMounted(loadAlertas);

async function loadAlertas() {
  isLoading.value = true;
  try {
    alertas.value = await asistenciaService.getAlertas();
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

async function handleRecalculate() {
  isRecalculating.value = true;
  try {
    const anio = await schoolConfigService.getAnioEscolar();
    await asistenciaService.calcularAlertas(anio.id);
    await loadAlertas();
    toast.success('Alertas recalculadas correctamente');
  } catch {
    toast.error('Error al recalcular alertas');
  } finally {
    isRecalculating.value = false;
  }
}

function getNivelVariant(nivel: string) {
  if (nivel === 'ROJO') return 'danger';
  if (nivel === 'NARANJA') return 'warning';
  if (nivel === 'AMARILLO') return 'info';
  return 'success';
}

function getPorcentajeClass(p: number) {
  if (p < 70) return 'bg-red-500';
  if (p < 80) return 'bg-orange-500';
  if (p < 90) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getPorcentajeTextClass(p: number) {
  if (p < 70) return 'text-red-600';
  if (p < 80) return 'text-orange-600';
  if (p < 90) return 'text-yellow-600';
  return 'text-green-600';
}

function verDetalle(row: any) {
  router.push(`/matriculas/${row.matricula_id}`);
}
</script>
