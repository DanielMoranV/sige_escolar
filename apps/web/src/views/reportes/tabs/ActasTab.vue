<template>
  <div class="space-y-6">
    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-end gap-4">
      <div class="flex-1">
        <BaseSelect v-model="seccionId" label="Grado y Sección" :options="seccionesOptions" />
      </div>
      <BaseButton :loading="isLoading" @click="loadActa" :disabled="!seccionId">
        <SearchIcon class="w-4 h-4" />
        Ver Acta
      </BaseButton>
    </div>

    <!-- Resumen estadístico -->
    <div v-if="resultados.length" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p class="text-2xl font-bold text-green-700">{{ stats.promovidos }}</p>
        <p class="text-xs text-green-600 mt-1">Promovidos</p>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <p class="text-2xl font-bold text-amber-700">{{ stats.recuperacion }}</p>
        <p class="text-xs text-amber-600 mt-1">Recuperación</p>
      </div>
      <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <p class="text-2xl font-bold text-red-700">{{ stats.permanecen }}</p>
        <p class="text-xs text-red-600 mt-1">Permanecen</p>
      </div>
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <p class="text-2xl font-bold text-gray-700">{{ resultados.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Total</p>
      </div>
    </div>

    <!-- Tabla de acta -->
    <div v-if="resultados.length" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <BaseTable :columns="columns" :data="resultados">
        <template #cell-estudiante="{ row }">
          <span class="font-medium text-gray-900">{{ row.apellido_paterno }} {{ row.apellido_materno }}, {{ row.nombres }}</span>
        </template>
        <template #cell-resultado="{ row }">
          <BaseBadge :variant="getVariant(row.resultado)">{{ row.resultado }}</BaseBadge>
        </template>
        <template #cell-resultado_final="{ row }">
          <BaseBadge v-if="row.resultado_recuperacion" :variant="getVariant(row.resultado_recuperacion)">
            {{ row.resultado_recuperacion }}
          </BaseBadge>
          <span v-else class="text-gray-400 text-xs">—</span>
        </template>
        <template #cell-areas="{ row }">
          <template v-if="row.areas_recuperacion?.length">
            <span
              v-for="area in row.areas_recuperacion"
              :key="area"
              class="inline-block mr-1 mb-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded"
            >{{ area }}</span>
          </template>
          <span v-else class="text-gray-400 text-xs">—</span>
        </template>
      </BaseTable>
    </div>

    <div v-else-if="hasLoaded && !isLoading" class="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <p class="text-gray-500">No hay resultados de cierre para esta sección. Ejecute el Cierre de Año primero.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { SearchIcon } from 'lucide-vue-next';
import { reportesService } from '../../../api/services/reportes.service';
import { useToast } from '../../../composables/useToast';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseSelect from '../../../components/ui/BaseSelect.vue';
import BaseTable from '../../../components/ui/BaseTable.vue';
import BaseBadge from '../../../components/ui/BaseBadge.vue';

const props = defineProps<{ seccionesOptions: any[] }>();
const toast = useToast();

const seccionId = ref('');
const resultados = ref<any[]>([]);
const isLoading = ref(false);
const hasLoaded = ref(false);

const columns = [
  { key: 'estudiante', label: 'Estudiante' },
  { key: 'resultado', label: 'Situación Inicial' },
  { key: 'areas', label: 'Áreas Déficit' },
  { key: 'resultado_final', label: 'Resultado Final' },
];

const stats = computed(() => ({
  promovidos: resultados.value.filter(r => (r.resultado_recuperacion ?? r.resultado) === 'PROMOVIDO').length,
  recuperacion: resultados.value.filter(r => r.resultado === 'RECUPERACION' && !r.resultado_recuperacion).length,
  permanecen: resultados.value.filter(r => (r.resultado_recuperacion ?? r.resultado) === 'PERMANECE').length,
}));

async function loadActa() {
  isLoading.value = true;
  hasLoaded.value = false;
  try {
    resultados.value = await reportesService.getActaBorrador(seccionId.value);
    hasLoaded.value = true;
  } catch {
    toast.error('Error al cargar el acta de cierre');
  } finally {
    isLoading.value = false;
  }
}

function getVariant(resultado: string) {
  if (resultado === 'PROMOVIDO') return 'success';
  if (resultado === 'RECUPERACION') return 'warning';
  if (resultado === 'PERMANECE') return 'danger';
  return 'neutral';
}
</script>
