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

      <div v-if="exportData" class="space-y-4 animate-in fade-in duration-500">
        <div class="flex items-center justify-between border-b pb-4">
          <h3 class="font-bold text-gray-800">Vista Previa: Consolidado de {{ getMesNombre(selectedMes) }}</h3>
          <span class="text-xs text-gray-500">Días lectivos: {{ exportData.totalDiasLectivos }}</span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">DNI</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Asist.</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">F. Just.</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">F. Injust.</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in exportData.data" :key="item.dni" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.dni }}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.apellido_paterno }} {{ item.apellido_materno }}, {{ item.nombres }}</td>
                <td class="px-4 py-3 text-sm text-center font-bold text-green-600">{{ item.asistencias }}</td>
                <td class="px-4 py-3 text-sm text-center text-blue-600">{{ item.faltas_justificadas }}</td>
                <td class="px-4 py-3 text-sm text-center font-bold text-red-600">{{ item.faltas_injustificadas }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
          <InfoIcon class="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p class="text-sm text-blue-800 font-medium">Instrucciones para el SIAGIE</p>
            <p class="text-xs text-blue-700 mt-1">
              Descargue el archivo Excel oficial del SIAGIE para este mes y sección, y copie los valores de las columnas Asist., F. Just. y F. Injust. exactamente como aparecen aquí.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  DownloadIcon,
  InfoIcon
} from 'lucide-vue-next';
import { asistenciaService } from '../../api/services/asistencia.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';

const selectedMes = ref((new Date().getMonth() + 1).toString());
const selectedSeccion = ref('');
const seccionesOptions = ref<any[]>([]);
const isExporting = ref(false);
const exportData = ref<any>(null);

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
  seccionesOptions.value = [
    { label: 'Todas las secciones', value: '' },
    ...secc.map((s: any) => ({
      label: `${s.grado_nombre} - ${s.nombre}`,
      value: s.id
    }))
  ];
});

async function handleExport() {
  isExporting.value = true;
  try {
    const anio = await schoolConfigService.getAnioEscolar();
    const data = await asistenciaService.exportSiagie({
      mes: parseInt(selectedMes.value, 10),
      anioEscolarId: anio.id,
      seccionId: selectedSeccion.value || undefined
    });
    exportData.value = data;
  } catch (error) {
    alert('Error al generar el reporte');
  } finally {
    isExporting.value = false;
  }
}

function getMesNombre(mes: string) {
  return meses.find(m => m.value === mes)?.label || '';
}
</script>
