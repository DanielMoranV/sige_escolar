<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Asistencia</h1>
        <p class="text-gray-500 mt-1">Registro diario y alertas de inasistencia.</p>
      </div>
      <template v-if="activeTab === 'registro'">
        <div class="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <BaseButton variant="secondary" size="sm" @click="marcarTodosPresentes">
            Marcar todos presentes
          </BaseButton>
          <div class="w-px h-6 bg-gray-200 mx-1"></div>
          <BaseButton :loading="isSaving" @click="handleSave">
            <SaveIcon class="w-4 h-4" />
            Guardar Asistencia
          </BaseButton>
        </div>
      </template>
      <template v-else>
        <BaseButton :loading="isRecalculating" @click="handleRecalculate">
          <RefreshCwIcon class="w-4 h-4" />
          Recalcular Alertas
        </BaseButton>
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

    <!-- Tab: Registro Diario -->
    <template v-if="activeTab === 'registro'">
      <!-- Selectores -->
      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseSelect
          v-model="selectedSeccion"
          label="Sección"
          :options="seccionesOptions"
          placeholder="Seleccione sección..."
        />
        <BaseInput
          v-model="selectedFecha"
          type="date"
          label="Fecha"
        />
        <div class="flex items-end pb-1">
          <div v-if="hasChanges" class="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 animate-pulse">
            <AlertCircleIcon class="w-4 h-4" />
            <span class="text-xs font-medium">Cambios sin guardar</span>
          </div>
          <div v-else-if="asistenciaData.length > 0 && !diaRegistrado" class="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
            <ClipboardXIcon class="w-4 h-4" />
            <span class="text-xs font-medium">Sin registro para este día</span>
          </div>
          <div v-else-if="diaRegistrado" class="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
            <CheckCircleIcon class="w-4 h-4" />
            <span class="text-xs font-medium">Asistencia registrada</span>
          </div>
        </div>
      </div>

      <!-- Lista de Estudiantes -->
      <div v-if="selectedSeccion" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div v-if="isLoading" class="p-12 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-500">Cargando lista de estudiantes...</p>
        </div>

        <div v-else-if="asistenciaData.length === 0" class="p-12 text-center text-gray-500">
          No hay estudiantes matriculados en esta sección.
        </div>

        <div v-if="!diaRegistrado && !hasChanges" class="flex items-start gap-3 px-4 py-3 bg-orange-50 border-b border-orange-100 text-orange-800 text-sm">
          <AlertCircleIcon class="w-4 h-4 shrink-0 mt-0.5" />
          <span>Este día aún no tiene asistencia guardada. Los estados mostrados son <strong>valores por defecto</strong> — revise y guarde para confirmar.</span>
        </div>

        <BaseTable :columns="headers" :data="asistenciaData">
          <template #cell-estudiante="{ row }">
            <div class="flex flex-col">
              <span class="font-medium text-gray-900">{{ row.apellido_paterno }} {{ row.apellido_materno }}, {{ row.nombres }}</span>
              <span class="text-xs text-gray-500">{{ row.dni }}</span>
            </div>
          </template>

          <template #cell-estado="{ row }">
            <div class="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100 w-fit">
              <button
                v-for="opt in estadosAsistencia"
                :key="opt.value"
                @click="setEstado(row, opt.value)"
                class="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                :class="[row.estado === opt.value ? opt.activeClass : 'text-gray-400 hover:text-gray-600 hover:bg-white']"
                :title="opt.label"
              >
                {{ opt.short }}
              </button>
            </div>
          </template>

          <template #cell-observacion="{ row }">
            <input
              v-model="row.observacion"
              type="text"
              placeholder="Nota opcional..."
              class="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-600"
              @input="hasChanges = true"
            />
          </template>
        </BaseTable>
      </div>

      <div v-else class="bg-blue-50 border border-blue-100 rounded-2xl p-12 text-center space-y-4">
        <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <UsersIcon class="w-8 h-8" />
        </div>
        <div class="max-w-sm mx-auto">
          <h3 class="text-lg font-bold text-blue-900">Seleccione una sección</h3>
          <p class="text-blue-700 text-sm">Debe elegir una sección y una fecha para comenzar a tomar asistencia.</p>
        </div>
      </div>
    </template>

    <!-- Tab: Alertas -->
    <template v-if="activeTab === 'alertas'">
      <div v-if="isLoadingAlertas" class="p-12 text-center">
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
        <BaseTable :columns="alertasColumns" :data="alertas">
          <template #cell-estudiante="{ row }">
            <div class="flex flex-col">
              <span class="font-medium text-gray-900">{{ row.apellido_paterno }}, {{ row.nombres }}</span>
              <span class="text-xs text-gray-500">{{ row.grado }} - {{ row.seccion }}</span>
            </div>
          </template>
          <template #cell-nivel_alerta="{ row }">
            <BaseBadge :variant="getNivelVariant(row.nivel_alerta)">{{ row.nivel_alerta }}</BaseBadge>
          </template>
          <template #cell-porcentaje_asistencia="{ row }">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                <div class="h-full rounded-full" :class="getPorcentajeClass(row.porcentaje_asistencia)" :style="{ width: `${row.porcentaje_asistencia}%` }"></div>
              </div>
              <span class="text-sm font-semibold" :class="getPorcentajeTextClass(row.porcentaje_asistencia)">{{ row.porcentaje_asistencia }}%</span>
            </div>
          </template>
          <template #cell-detalle="{ row }">
            <span class="text-xs text-gray-600">{{ row.faltas_injustificadas }} faltas • {{ row.tardanzas_acumuladas }} tardanzas</span>
          </template>
          <template #actions="{ row }">
            <BaseButton variant="secondary" size="sm" @click="router.push(`/matriculas/${row.matricula_id}`)">
              Ver Detalle
            </BaseButton>
          </template>
        </BaseTable>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { SaveIcon, CheckCircleIcon, AlertCircleIcon, UsersIcon, RefreshCwIcon, ClipboardXIcon } from 'lucide-vue-next';
import { asistenciaService } from '../../api/services/asistencia.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import { useAuthStore } from '../../stores/auth.store';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseTable from '../../components/ui/BaseTable.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';

const toast = useToast();
const router = useRouter();
const authStore = useAuthStore();

const isDirector = computed(() => authStore.user?.rol === 'DIRECTOR' || authStore.user?.rol === 'SUPER_ADMIN');
const activeTab = ref('registro');
const tabs = [
  { id: 'registro', label: 'Registro Diario' },
  { id: 'alertas', label: 'Alertas de Asistencia' },
];

// --- Registro Diario ---
const selectedSeccion = ref('');
const selectedFecha = ref(new Date().toISOString().split('T')[0]);
const seccionesOptions = ref<any[]>([]);
const asistenciaData = ref<any[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const hasChanges = ref(false);

const diaRegistrado = computed(() => asistenciaData.value.some(a => a.asistenciaId !== null));

const headers = [
  { key: 'estudiante', label: 'Estudiante' },
  { key: 'estado', label: 'Estado de Asistencia' },
  { key: 'observacion', label: 'Observación' },
];

const estadosAsistencia = [
  { value: 'PRESENTE', short: 'P', label: 'Presente', activeClass: 'bg-green-500 text-white shadow-sm' },
  { value: 'TARDANZA', short: 'T', label: 'Tardanza', activeClass: 'bg-amber-500 text-white shadow-sm' },
  { value: 'FALTA_INJUSTIFICADA', short: 'FI', label: 'Falta Injustificada', activeClass: 'bg-red-500 text-white shadow-sm' },
  { value: 'FALTA_JUSTIFICADA', short: 'FJ', label: 'Falta Justificada', activeClass: 'bg-blue-500 text-white shadow-sm' },
  { value: 'LICENCIA', short: 'L', label: 'Licencia', activeClass: 'bg-purple-500 text-white shadow-sm' },
];

// --- Alertas ---
const alertas = ref<any[]>([]);
const isLoadingAlertas = ref(false);
const isRecalculating = ref(false);

const alertasColumns = [
  { key: 'estudiante', label: 'Estudiante' },
  { key: 'nivel_alerta', label: 'Nivel Riesgo' },
  { key: 'porcentaje_asistencia', label: '% Asistencia' },
  { key: 'detalle', label: 'Resumen' },
];

onMounted(async () => {
  const secc = await schoolConfigService.getSecciones();
  seccionesOptions.value = secc.map((s: any) => ({ label: `${s.grado_nombre} - ${s.nombre}`, value: s.id }));
  if (secc.length > 0) selectedSeccion.value = secc[0].id;
});

watch(activeTab, (tab) => {
  if (tab === 'alertas' && !alertas.value.length) loadAlertas();
});

watch([selectedSeccion, selectedFecha], () => {
  if (selectedSeccion.value && selectedFecha.value) loadAsistencia();
});

async function loadAsistencia() {
  isLoading.value = true;
  hasChanges.value = false;
  try {
    const data = await asistenciaService.getSeccionAsistencia(selectedSeccion.value, selectedFecha.value);
    asistenciaData.value = data;
  } catch {
    toast.error('Error al cargar la asistencia');
  } finally {
    isLoading.value = false;
  }
}

function setEstado(item: any, estado: string) {
  item.estado = estado;
  hasChanges.value = true;
}

function marcarTodosPresentes() {
  asistenciaData.value.forEach(item => { item.estado = 'PRESENTE'; });
  hasChanges.value = true;
}

async function handleSave() {
  if (!selectedSeccion.value || !selectedFecha.value) return;
  isSaving.value = true;
  try {
    const items = asistenciaData.value.map(item => ({
      matriculaId: item.matricula_id,
      estado: item.estado,
      observacion: item.observacion,
      horaLlegada: item.horaLlegada
    }));
    await asistenciaService.registerBulk(selectedSeccion.value, selectedFecha.value, items);
    await loadAsistencia();
    toast.success('Asistencia guardada correctamente');
  } catch {
    toast.error('Error al guardar asistencia');
  } finally {
    isSaving.value = false;
  }
}

async function loadAlertas() {
  isLoadingAlertas.value = true;
  try {
    alertas.value = await asistenciaService.getAlertas();
  } catch {
    toast.error('Error al cargar alertas');
  } finally {
    isLoadingAlertas.value = false;
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
</script>
