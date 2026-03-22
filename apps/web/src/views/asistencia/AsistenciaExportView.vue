<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Exportar a SIAGIE</h1>
      <p class="text-gray-500 mt-1">Genere el reporte mensual de asistencia consolidado para cargar en el sistema oficial.</p>
    </div>

    <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseSelect
          v-model="selectedMes"
          label="Mes"
          :options="meses"
        />
        <BaseSelect
          v-model="selectedSeccion"
          label="Sección (Opcional)"
          :options="seccionesOptions"
          placeholder="Todas las secciones"
        />
        <div class="flex items-end pb-1">
          <BaseButton class="w-full" :loading="isExporting" @click="handleExport">
            <DownloadIcon class="w-4 h-4" />
            Generar Reporte
          </BaseButton>
        </div>
      </div>

      <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
        <InfoIcon class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm text-blue-800 font-medium">Instrucciones para el SIAGIE</p>
          <p class="text-xs text-blue-700 mt-1">
            Descargue el archivo Excel y cargue los datos de asistencia en el sistema SIAGIE del MINEDU.
            El archivo incluye los totales de asistencia, faltas justificadas e injustificadas por estudiante.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { DownloadIcon, InfoIcon } from 'lucide-vue-next';
import { asistenciaService } from '../../api/services/asistencia.service';
import { mesActualLima } from '../../utils/date';
import { schoolConfigService } from '../../api/services/school-config.service';
import { useNivelStore } from '../../stores/nivel.store';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';

const toast = useToast();
const nivelStore = useNivelStore();

const selectedMes = ref(mesActualLima().toString());
const selectedSeccion = ref('');
const rawSecciones = ref<any[]>([]);
const seccionesOptions = computed(() => {
  const filtered = nivelStore.nivelActivo === 'TODOS'
    ? rawSecciones.value
    : rawSecciones.value.filter(s => s.nivel === nivelStore.nivelActivo);
  return [
    { label: 'Todas las secciones', value: '' },
    ...filtered.map(s => ({ label: `${s.grado_nombre} - ${s.nombre}`, value: s.id })),
  ];
});
const isExporting = ref(false);

const meses = [
  { label: 'Marzo', value: '3' },
  { label: 'Abril', value: '4' },
  { label: 'Mayo', value: '5' },
  { label: 'Junio', value: '6' },
  { label: 'Julio', value: '7' },
  { label: 'Agosto', value: '8' },
  { label: 'Septiembre', value: '9' },
  { label: 'Octubre', value: '10' },
  { label: 'Noviembre', value: '11' },
  { label: 'Diciembre', value: '12' },
];

onMounted(async () => {
  const secc = await schoolConfigService.getSecciones();
  rawSecciones.value = secc;
});

async function handleExport() {
  isExporting.value = true;
  try {
    const anio = await schoolConfigService.getAnioEscolar();
    const blob = await asistenciaService.exportSiagie({
      mes: parseInt(selectedMes.value, 10),
      anioEscolarId: anio.id,
      seccionId: selectedSeccion.value || undefined,
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Asistencia_SIAGIE_${getMesNombre(selectedMes.value)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success('Reporte generado y descargado correctamente');
  } catch {
    toast.error('Error al generar el reporte');
  } finally {
    isExporting.value = false;
  }
}

function getMesNombre(mes: string) {
  return meses.find(m => m.value === mes)?.label || '';
}
</script>
