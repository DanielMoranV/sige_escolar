<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Exportar Calificaciones SIAGIE</h1>
      <p class="text-gray-500 mt-1">Genere el consolidado de notas por periodo para la carga masiva en el sistema oficial.</p>
    </div>

    <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseSelect
          v-model="filters.periodoId"
          label="Periodo"
          :options="periodosOptions"
        />
        <BaseSelect
          v-model="filters.seccionId"
          label="Sección"
          :options="seccionesOptions"
        />
        <div class="flex items-end pb-1 gap-2">
          <BaseButton class="flex-1" :loading="isExporting" @click="handleExport" :disabled="!canExport">
            <DownloadIcon class="w-4 h-4" />
            Generar Consolidado
          </BaseButton>
          <BaseButton variant="secondary" :loading="isClosing" @click="handleClose" :disabled="!canExport" title="Cerrar Periodo">
            <LockIcon class="w-4 h-4" />
          </BaseButton>
        </div>
      </div>

      <div v-if="exportData" class="space-y-4 animate-in fade-in duration-500">
        <div class="flex items-center justify-between border-b pb-4">
          <h3 class="font-bold text-gray-800">Vista Previa: Consolidado de Notas</h3>
          <span class="text-xs text-gray-500">Total registros: {{ exportData.data.length }}</span>
        </div>

        <div class="overflow-x-auto max-h-[500px]">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Competencia</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Nota</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(item, idx) in exportData.data" :key="idx" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.apellido_paterno }} {{ item.apellido_materno }}, {{ item.nombres }}</td>
                <td class="px-4 py-3 text-xs text-gray-600">{{ item.competencia_nombre }}</td>
                <td class="px-4 py-3 text-sm text-center font-bold" :class="item.calificativo_literal === 'C' || (item.calificativo_numerico !== null && item.calificativo_numerico < 11) ? 'text-red-600' : 'text-blue-600'">
                  {{ item.calificativo_literal || item.calificativo_numerico || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3">
          <InfoIcon class="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p class="text-sm text-amber-800 font-medium">Consideraciones</p>
            <p class="text-xs text-amber-700 mt-1">
              Este reporte muestra los calificativos finales por competencia. Asegúrese de que todos los docentes hayan terminado su registro antes de cerrar el periodo y exportar al SIAGIE.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  DownloadIcon,
  InfoIcon,
  LockIcon
} from 'lucide-vue-next';
import { notasService } from '../../api/services/notas.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';

const filters = ref({
  periodoId: '',
  seccionId: '',
});

const periodosOptions = ref<any[]>([]);
const seccionesOptions = ref<any[]>([]);
const isExporting = ref(false);
const isClosing = ref(false);
const exportData = ref<any>(null);

const canExport = computed(() => filters.value.periodoId && filters.value.seccionId);

onMounted(async () => {
  const [p, s] = await Promise.all([
    schoolConfigService.getPeriodos(),
    schoolConfigService.getSecciones(),
  ]);
  periodosOptions.value = p.map((item: any) => ({ label: item.nombre, value: item.id }));
  seccionesOptions.value = s.map((item: any) => ({ label: `${item.grado_nombre} - ${item.nombre}`, value: item.id }));
});

async function handleExport() {
  isExporting.value = true;
  try {
    const data = await notasService.exportSiagie(filters.value);
    exportData.value = data;
  } catch (error) {
    alert('Error al generar el reporte');
  } finally {
    isExporting.value = false;
  }
}

async function handleClose() {
  if (!confirm('¿Está seguro de cerrar este periodo para la sección seleccionada? Esto bloqueará nuevas ediciones.')) return;
  isClosing.value = true;
  try {
    await notasService.cerrarPeriodo(filters.value);
    alert('Periodo cerrado correctamente');
  } catch (error) {
    alert('Error al cerrar el periodo');
  } finally {
    isClosing.value = false;
  }
}
</script>
