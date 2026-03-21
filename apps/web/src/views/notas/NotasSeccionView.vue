<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Notas</h1>
        <p class="text-gray-500 mt-1">Registro de calificaciones y exportación al SIAGIE.</p>
      </div>
      <template v-if="activeTab === 'calificaciones'">
        <div v-if="hasChanges" class="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100 text-xs font-medium animate-pulse">
          <SaveIcon class="w-3 h-3" />
          Cambios pendientes...
        </div>
        <div v-else-if="lastSaved" class="text-xs text-gray-400">
          Guardado a las {{ lastSaved }}
        </div>
      </template>
    </div>

    <!-- Tabs (solo director) -->
    <div v-if="isDirector" class="border-b border-gray-200">
      <nav class="flex gap-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="pb-4 text-sm font-medium transition-colors relative"
          :class="activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'"
        >
          {{ tab.label }}
          <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
        </button>
      </nav>
    </div>

    <!-- Tab: Calificaciones -->
    <template v-if="activeTab === 'calificaciones'">
      <!-- Filtros -->
      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <BaseSelect v-model="filters.seccionId" label="Grado y Sección" :options="seccionesOptions" />
        <BaseSelect v-model="filters.periodoId" label="Periodo" :options="periodosOptions" :disabled="!filters.seccionId" />
        <BaseSelect v-model="filters.areaId" label="Área Curricular" :options="areasOptions" :disabled="!filters.seccionId" />
        <div class="flex items-end pb-1">
          <BaseButton class="w-full" :loading="isLoading" @click="cargarGrilla" :disabled="!canLoad">
            <SearchIcon class="w-4 h-4" />
            Cargar Grilla
          </BaseButton>
        </div>
      </div>

      <!-- Banner periodo cerrado -->
      <div v-if="periodoCerrado && grillaData" class="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
        <LockIcon class="w-4 h-4 shrink-0" />
        <span>Este periodo está <strong>cerrado</strong>. Solo puede visualizar las calificaciones.</span>
      </div>

      <!-- Grilla -->
      <div v-if="grillaData" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-64 sticky left-0 bg-gray-50 z-10 border-r">Estudiante</th>
              <th v-for="comp in grillaData.competencias" :key="comp.id" class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase min-w-[160px]">
                <div class="flex flex-col gap-1">
                  <span class="truncate w-36 mx-auto" :title="comp.nombre_display">{{ comp.nombre_display }}</span>
                  <span class="text-[10px] text-gray-400 lowercase font-normal italic">Competencia {{ comp.orden }}</span>
                </div>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase min-w-[260px]">Conclusión Descriptiva</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-for="est in grillaData.estudiantes" :key="est.matricula_id" class="hover:bg-blue-50/30 transition-colors">
              <td class="px-4 py-3 sticky left-0 bg-white z-10 border-r">
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-gray-900 truncate w-56">{{ est.apellido_paterno }} {{ est.apellido_materno }}, {{ est.nombres }}</span>
                  <span class="text-[10px] text-gray-500">DNI: {{ est.dni }}</span>
                </div>
              </td>
              <td v-for="nota in est.notas" :key="nota.competenciaIeId" class="px-4 py-3 text-center">
                <div class="flex justify-center">
                  <CalificativoInput
                    :nivel="nivelActual"
                    :disabled="periodoCerrado"
                    v-model:literal="nota.calificativoLiteral"
                    v-model:numerico="nota.calificativoNumerico"
                    @change="markChanges"
                  />
                </div>
              </td>
              <td class="px-4 py-3">
                <textarea
                  v-model="est.conclusion"
                  rows="1"
                  :disabled="periodoCerrado"
                  @input="markChanges"
                  placeholder="Evidencia de aprendizaje..."
                  class="w-full text-xs border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none py-1 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                ></textarea>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!isLoading" class="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 text-gray-400 shadow-sm">
          <LayoutGridIcon class="w-8 h-8" />
        </div>
        <h3 class="text-gray-900 font-medium">Grilla no cargada</h3>
        <p class="text-gray-500 text-sm max-w-xs mx-auto mt-1">Seleccione el periodo, área y sección para comenzar a registrar notas.</p>
      </div>

      <div v-if="grillaData && !periodoCerrado" class="flex justify-end">
        <BaseButton :loading="isSaving" @click="saveAll" :disabled="!hasChanges">
          <SaveIcon class="w-4 h-4" />
          Guardar Todo
        </BaseButton>
      </div>
    </template>

    <!-- Tab: Exportar a SIAGIE -->
    <template v-if="activeTab === 'exportar'">
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseSelect v-model="expFilters.periodoId" label="Periodo" :options="expPeriodosOptions" />
          <BaseSelect v-model="expFilters.seccionId" label="Sección" :options="expSeccionesOptions" />
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

        <div class="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3">
          <InfoIcon class="w-5 h-5 text-amber-600 shrink-0" />
          <p class="text-xs text-amber-700">
            Asegúrese de que todos los docentes hayan terminado su registro antes de cerrar el periodo y exportar al SIAGIE.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { SearchIcon, LayoutGridIcon, SaveIcon, LockIcon, DownloadIcon, InfoIcon } from 'lucide-vue-next';
import { schoolConfigService } from '../../api/services/school-config.service';
import { notasService } from '../../api/services/notas.service';
import { useAuthStore } from '../../stores/auth.store';
import { useToast } from '../../composables/useToast';
import { useNivelStore } from '../../stores/nivel.store';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import CalificativoInput from '../../components/ui/CalificativoInput.vue';

const toast = useToast();
const authStore = useAuthStore();
const nivelStore = useNivelStore();

const isDirector = computed(() => authStore.user?.rol === 'DIRECTOR' || authStore.user?.rol === 'SUPER_ADMIN');
const activeTab = ref('calificaciones');
const tabs = [
  { id: 'calificaciones', label: 'Calificaciones' },
  { id: 'exportar', label: 'Exportar a SIAGIE' },
];

// --- Calificaciones ---
const todasSecciones = ref<any[]>([]);
const todasAreas = ref<any[]>([]);
const todosPeriodos = ref<any[]>([]);

const filters = ref({ seccionId: '', periodoId: '', areaId: '' });
const isLoading = ref(false);
const isSaving = ref(false);
const grillaData = ref<any>(null);
const hasChanges = ref(false);
const lastSaved = ref('');

const nivelActual = computed<'PRIMARIA' | 'SECUNDARIA'>(() => {
  if (!filters.value.seccionId) return 'PRIMARIA';
  const secc = todasSecciones.value.find(s => s.id === filters.value.seccionId);
  return secc?.nivel || 'PRIMARIA';
});

const seccionesOptions = computed(() => {
  const filtered = nivelStore.nivelActivo === 'TODOS'
    ? todasSecciones.value
    : todasSecciones.value.filter(s => s.nivel === nivelStore.nivelActivo);
  return filtered.map(s => ({ label: `${s.grado_nombre} - ${s.nombre}`, value: s.id }));
});

const periodosOptions = computed(() =>
  todosPeriodos.value
    .filter(p => !filters.value.seccionId || p.nivel === nivelActual.value)
    .map(p => ({ label: p.nombre, value: p.id }))
);

const areasOptions = computed(() =>
  todasAreas.value
    .filter(a => !filters.value.seccionId || a.nivel === nivelActual.value)
    .map(a => ({ label: a.nombre_display, value: a.id }))
);

const periodoCerrado = computed(() => {
  if (!filters.value.periodoId) return false;
  const p = todosPeriodos.value.find(p => p.id === filters.value.periodoId);
  return p?.estado === 'CERRADO' || p?.estado === 'EXPORTADO';
});

const canLoad = computed(() => !!filters.value.periodoId && !!filters.value.areaId && !!filters.value.seccionId);

watch(() => filters.value.seccionId, () => {
  filters.value.periodoId = '';
  filters.value.areaId = '';
  grillaData.value = null;
  hasChanges.value = false;
});

// --- Exportar ---
const expFilters = ref({ periodoId: '', seccionId: '' });
const expPeriodosOptions = computed(() => todosPeriodos.value.map(p => ({ label: p.nombre, value: p.id })));
const expSeccionesOptions = computed(() => todasSecciones.value.map(s => ({ label: `${s.grado_nombre} - ${s.nombre}`, value: s.id })));
const isExporting = ref(false);
const isClosing = ref(false);
const canExport = computed(() => expFilters.value.periodoId && expFilters.value.seccionId);

onMounted(async () => {
  try {
    const [p, a, s] = await Promise.all([
      schoolConfigService.getPeriodos(),
      schoolConfigService.getAreas(),
      schoolConfigService.getSecciones(),
    ]);
    todosPeriodos.value = p;
    todasAreas.value = a;
    todasSecciones.value = s;
  } catch {
    toast.error('Error al cargar la configuración');
  }
});

async function cargarGrilla() {
  isLoading.value = true;
  grillaData.value = null;
  try {
    const data = await notasService.getGrilla(filters.value);
    data.estudiantes = data.estudiantes.map((est: any) => ({
      ...est,
      conclusion: est.conclusionDescriptiva || '',
    }));
    grillaData.value = data;
    hasChanges.value = false;
  } catch {
    toast.error('Error al cargar la grilla');
  } finally {
    isLoading.value = false;
  }
}

function markChanges() { hasChanges.value = true; }

async function saveAll() {
  if (!grillaData.value || !hasChanges.value) return;
  isSaving.value = true;
  try {
    const payload = {
      periodoId: filters.value.periodoId,
      notas: grillaData.value.estudiantes.flatMap((est: any) =>
        est.notas.map((n: any) => ({
          matriculaId: est.matricula_id,
          competenciaIeId: n.competenciaIeId,
          calificativoLiteral: n.calificativoLiteral,
          calificativoNumerico: n.calificativoNumerico,
          conclusionDescriptiva: est.conclusion,
        }))
      ),
    };
    await notasService.saveGrilla(payload);
    hasChanges.value = false;
    lastSaved.value = new Date().toLocaleTimeString();
    toast.success('Notas guardadas correctamente');
  } catch {
    toast.error('Error al guardar las notas');
  } finally {
    isSaving.value = false;
  }
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
watch(hasChanges, (val) => {
  if (val && !periodoCerrado.value) {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => saveAll(), 5000);
  }
});
onBeforeUnmount(() => { if (autoSaveTimer) clearTimeout(autoSaveTimer); });

async function handleExport() {
  isExporting.value = true;
  try {
    const blob = await notasService.exportSiagie(expFilters.value);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Notas_SIAGIE_${expFilters.value.periodoId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Archivo de notas descargado correctamente');
  } catch {
    toast.error('Error al generar el reporte');
  } finally {
    isExporting.value = false;
  }
}

async function handleClose() {
  isClosing.value = true;
  try {
    await notasService.cerrarPeriodo(expFilters.value);
    toast.success('Periodo cerrado correctamente');
  } catch {
    toast.error('Error al cerrar el periodo');
  } finally {
    isClosing.value = false;
  }
}
</script>
