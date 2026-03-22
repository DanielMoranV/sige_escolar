<template>
  <div class="space-y-6">
    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <BaseSelect
        v-model="periodoId"
        label="Periodo"
        :options="periodosOptions"
      />
      <BaseSelect
        v-model="seccionId"
        label="Grado y Sección"
        :options="seccionesOptions"
      />
      <div class="flex items-end pb-1 gap-2">
        <BaseButton class="flex-1" :loading="isLoading" @click="loadEstudiantes" :disabled="!canLoad">
          <SearchIcon class="w-4 h-4" />
          Ver Estudiantes
        </BaseButton>
        <BaseButton v-if="canLoad" variant="secondary" :loading="isDownloadingAll" @click="handleDownloadAll" title="Descargar sección completa">
          <DownloadIcon class="w-4 h-4" />
          Descargar sección completa
        </BaseButton>
      </div>
    </div>

    <div v-if="estudiantes.length" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <BaseTable
        :columns="columns"
        :data="estudiantes"
      >
        <template #cell-nombre="{ row }">
          <span class="font-medium text-gray-900">{{ row.apellido_paterno }} {{ row.apellido_materno }}, {{ row.nombres }}</span>
        </template>
        <template #cell-acciones="{ row }">
          <BaseButton size="sm" variant="secondary" @click="previewLibreta(row.id)">
            <FileTextIcon class="w-4 h-4" />
            Ver Libreta
          </BaseButton>
        </template>
      </BaseTable>
    </div>

    <div v-else-if="hasLoaded" class="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <p class="text-gray-500">No se encontraron estudiantes en esta sección.</p>
    </div>

    <!-- Preview Modal -->
    <BaseModal
      :show="showPreview"
      @close="showPreview = false"
      title="Vista Previa de Libreta"
      size="lg"
    >
      <div v-if="libretaLoading" class="p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
      <div v-else-if="libretaData" class="space-y-6 p-4 max-h-[70vh] overflow-y-auto">
        <div class="text-center border-b pb-4">
          <h2 class="text-xl font-bold text-gray-900">{{ libretaData.estudiante.colegio_nombre }}</h2>
          <p class="text-sm text-gray-500 italic">Informe de Progreso del Estudiante — {{ libretaData.periodo.nombre }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div>
            <p><span class="font-semibold">Estudiante:</span> {{ libretaData.estudiante.apellido_paterno }} {{ libretaData.estudiante.apellido_materno }}, {{ libretaData.estudiante.nombres }}</p>
            <p><span class="font-semibold">DNI:</span> {{ libretaData.estudiante.dni }}</p>
          </div>
          <div class="text-right">
            <p><span class="font-semibold">Grado:</span> {{ libretaData.estudiante.grado_nombre }}</p>
            <p><span class="font-semibold">Sección:</span> {{ libretaData.estudiante.seccion_nombre }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div v-for="area in libretaData.areas" :key="area.id" class="border rounded-lg overflow-hidden">
            <div class="bg-gray-100 px-3 py-2 font-bold text-xs uppercase text-gray-700">
              {{ area.nombre }}
            </div>
            <table class="min-w-full divide-y divide-gray-200">
              <tbody class="divide-y divide-gray-100">
                <tr v-for="comp in area.competencias" :key="comp.id">
                  <td class="px-3 py-2 text-xs text-gray-600 w-2/3">{{ comp.nombre }}</td>
                  <td class="px-3 py-2 text-xs font-bold text-center border-l w-16" :class="comp.nota === 'C' ? 'text-red-600' : 'text-blue-600'">
                    {{ comp.nota }}
                  </td>
                  <td class="px-3 py-2 text-[10px] text-gray-500 italic border-l">
                    {{ comp.conclusion || 'Sin conclusión registrada.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <h4 class="text-xs font-bold text-blue-800 uppercase mb-2">Resumen de Asistencia</h4>
          <div class="grid grid-cols-4 gap-2 text-center">
            <div v-for="(val, key) in libretaData.asistencia" :key="key" class="bg-white p-2 rounded border border-blue-100">
              <p class="text-[10px] text-gray-500 uppercase">{{ String(key).replace('_', ' ') }}</p>
              <p class="text-sm font-bold text-blue-700">{{ val }}</p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" @click="showPreview = false">Cerrar</BaseButton>
          <BaseButton @click="handleDownload">
            <DownloadIcon class="w-4 h-4" />
            Descargar PDF
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { SearchIcon, FileTextIcon, DownloadIcon } from 'lucide-vue-next';
import { schoolConfigService } from '../../../api/services/school-config.service';
import { useNivelStore } from '../../../stores/nivel.store';
import { reportesService } from '../../../api/services/reportes.service';
import apiClient from '../../../api/client';
import BaseSelect from '../../../components/ui/BaseSelect.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseTable from '../../../components/ui/BaseTable.vue';
import BaseModal from '../../../components/ui/BaseModal.vue';

const nivelStore = useNivelStore();
const periodoId = ref('');
const seccionId = ref('');
const periodosOptions = ref<any[]>([]);
const rawSecciones = ref<any[]>([]);
const seccionesOptions = computed(() => {
  const filtered = nivelStore.nivelActivo === 'TODOS'
    ? rawSecciones.value
    : rawSecciones.value.filter(s => s.nivel === nivelStore.nivelActivo);
  return filtered.map(s => ({ label: `${s.grado_nombre} - ${s.nombre}`, value: s.id }));
});
const isLoading = ref(false);
const isDownloadingAll = ref(false);
const hasLoaded = ref(false);
const estudiantes = ref<any[]>([]);

const showPreview = ref(false);
const libretaLoading = ref(false);
const libretaData = ref<any>(null);
const currentMatriculaId = ref('');

const canLoad = computed(() => periodoId.value && seccionId.value);

const columns = [
  { key: 'dni', label: 'DNI' },
  { key: 'nombre', label: 'Estudiante' },
  { key: 'acciones', label: 'Acciones' },
];

onMounted(async () => {
  const [p, s] = await Promise.all([
    schoolConfigService.getPeriodos(),
    schoolConfigService.getSecciones(),
  ]);
  periodosOptions.value = p.map((item: any) => ({ label: item.nombre, value: item.id }));
  rawSecciones.value = s;
});

async function loadEstudiantes() {
  isLoading.value = true;
  try {
    const { data } = await apiClient.get(`/matriculas?seccionId=${seccionId.value}&limit=100`);
    estudiantes.value = data.data?.data || [];
    hasLoaded.value = true;
  } catch (err) {
    alert('Error al cargar estudiantes');
  } finally {
    isLoading.value = false;
  }
}

async function previewLibreta(matriculaId: string) {
  currentMatriculaId.value = matriculaId;
  showPreview.value = true;
  libretaLoading.value = true;
  try {
    libretaData.value = await reportesService.getLibreta(matriculaId, periodoId.value);
  } catch (err) {
    alert('Error al cargar la libreta');
    showPreview.value = false;
  } finally {
    libretaLoading.value = false;
  }
}

async function handleDownloadAll() {
  isDownloadingAll.value = true;
  try {
    const blob = await reportesService.descargarLibretasSeccion(seccionId.value, periodoId.value);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Libretas_${seccionId.value}_${periodoId.value}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    alert('Error al generar las libretas de la sección');
  } finally {
    isDownloadingAll.value = false;
  }
}

async function handleDownload() {
  try {
    const blob = await reportesService.downloadLibretaPdf(currentMatriculaId.value, periodoId.value);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Libreta_${libretaData.value?.estudiante?.dni || currentMatriculaId.value}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    alert('Error al generar el PDF');
  }
}
</script>
