<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">SIAGIE</h1>
      <p class="text-gray-500 mt-1">Exportaciones y seguimiento de carga en el sistema del MINEDU.</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
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

    <!-- Tab: Historial -->
    <template v-if="activeTab === 'historial'">
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <BaseTable :columns="columns" :data="logs" :loading="isLoading">
          <template #cell-modulo="{ row }">
            <span class="font-semibold text-gray-800">{{ row.modulo.replace('_', ' ') }}</span>
          </template>
          <template #cell-estado="{ row }">
            <BaseBadge :variant="getEstadoVariant(row.estado)">{{ row.estado.replace(/_/g, ' ') }}</BaseBadge>
          </template>
          <template #cell-fechas="{ row }">
            <div class="text-xs text-gray-600">
              <p><strong>Exportado:</strong> {{ new Date(row.exportado_en).toLocaleString() }}</p>
              <p v-if="row.cargado_en"><strong>Cargado:</strong> {{ new Date(row.cargado_en).toLocaleString() }}</p>
            </div>
          </template>
          <template #cell-acciones="{ row }">
            <div class="flex gap-2">
              <BaseButton size="sm" variant="secondary" title="Descargar Excel generado">
                <DownloadIcon class="w-4 h-4" />
              </BaseButton>
              <BaseButton v-if="row.estado === 'EXPORTADO'" size="sm" @click="abrirModal(row)">
                Confirmar Carga
              </BaseButton>
            </div>
          </template>
        </BaseTable>
      </div>

      <BaseModal :show="showModal" @close="showModal = false" title="Confirmar carga en SIAGIE">
        <div class="space-y-4">
          <p class="text-sm text-gray-600">¿El archivo fue procesado correctamente por el sistema SIAGIE?</p>
          <BaseSelect
            v-model="form.estado"
            label="Resultado de la carga"
            :options="[
              { label: 'Carga Exitosa (Sin errores)', value: 'CARGADO_OK' },
              { label: 'Carga con Errores (Rechazado parcialmente)', value: 'CARGADO_CON_ERRORES' }
            ]"
          />
          <BaseInput
            v-if="form.estado === 'CARGADO_CON_ERRORES'"
            v-model="form.observacion"
            label="Detalle de los errores (Opcional)"
            placeholder="Ej: DNI inválido en 2 estudiantes..."
          />
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <BaseButton variant="secondary" @click="showModal = false">Cancelar</BaseButton>
            <BaseButton @click="guardarConfirmacion" :loading="isSaving">Guardar Estado</BaseButton>
          </div>
        </template>
      </BaseModal>
    </template>

    <!-- Tab: Exportar Asistencia -->
    <template v-if="activeTab === 'asistencia'">
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseSelect v-model="selectedMes" label="Mes" :options="meses" />
          <BaseSelect v-model="selectedSeccion" label="Sección (Opcional)" :options="seccionesOptions" placeholder="Todas las secciones" />
          <div class="flex items-end pb-1">
            <BaseButton class="w-full" :loading="isExportingAsistencia" @click="handleExportAsistencia">
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
    </template>

    <!-- Tab: Exportar Notas -->
    <template v-if="activeTab === 'notas'">
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseSelect v-model="expFilters.periodoId" label="Periodo" :options="periodosOptions" />
          <BaseSelect v-model="expFilters.seccionId" label="Sección" :options="seccionesOptions" />
          <div class="flex items-end pb-1 gap-2">
            <BaseButton class="flex-1" :loading="isExportingNotas" @click="handleExportNotas" :disabled="!canExportNotas">
              <DownloadIcon class="w-4 h-4" />
              Generar Consolidado
            </BaseButton>
            <BaseButton variant="secondary" :loading="isClosing" @click="handleClose" :disabled="!canExportNotas" title="Cerrar Periodo">
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
import { ref, computed, onMounted } from 'vue';
import { DownloadIcon, InfoIcon, LockIcon } from 'lucide-vue-next';
import { siagieService } from '../../api/services/siagie.service';
import { notasService } from '../../api/services/notas.service';
import { asistenciaService } from '../../api/services/asistencia.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import { useNivelStore } from '../../stores/nivel.store';
import { useToast } from '../../composables/useToast';
import BaseTable from '../../components/ui/BaseTable.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseInput from '../../components/ui/BaseInput.vue';

const toast = useToast();
const nivelStore = useNivelStore();

const activeTab = ref('historial');
const tabs = [
  { id: 'historial', label: 'Historial' },
  { id: 'asistencia', label: 'Exportar Asistencia' },
  { id: 'notas', label: 'Exportar Notas' },
];

// --- Datos compartidos ---
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
const periodosOptions = ref<any[]>([]);
const anioId = ref('');

onMounted(async () => {
  try {
    const [anio, secc, per] = await Promise.all([
      schoolConfigService.getAnioEscolar(),
      schoolConfigService.getSecciones(),
      schoolConfigService.getPeriodos(),
    ]);
    anioId.value = anio.id;
    rawSecciones.value = secc;
    periodosOptions.value = per.map((p: any) => ({ label: p.nombre, value: p.id }));
    await loadLogs();
  } catch {
    toast.error('Error al cargar datos');
  }
});

// --- Historial ---
const logs = ref<any[]>([]);
const isLoading = ref(true);
const showModal = ref(false);
const selectedLog = ref<any>(null);
const isSaving = ref(false);
const form = ref({ estado: 'CARGADO_OK', observacion: '' });

const columns = [
  { key: 'modulo', label: 'Módulo' },
  { key: 'archivo_nombre', label: 'Archivo' },
  { key: 'estado', label: 'Estado' },
  { key: 'fechas', label: 'Trazabilidad' },
  { key: 'acciones', label: 'Acciones' },
];

async function loadLogs() {
  if (!anioId.value) return;
  isLoading.value = true;
  try {
    const response = await siagieService.getSyncLog(anioId.value);
    logs.value = response.data || [];
  } catch {
    // silencioso
  } finally {
    isLoading.value = false;
  }
}

function getEstadoVariant(estado: string) {
  if (estado === 'CARGADO_OK') return 'success';
  if (estado === 'CARGADO_CON_ERRORES') return 'danger';
  if (estado === 'EXPORTADO') return 'info';
  return 'neutral';
}

function abrirModal(row: any) {
  selectedLog.value = row;
  form.value = { estado: 'CARGADO_OK', observacion: '' };
  showModal.value = true;
}

async function guardarConfirmacion() {
  isSaving.value = true;
  try {
    await siagieService.confirmarSync(selectedLog.value.id, form.value);
    showModal.value = false;
    await loadLogs();
    toast.success('Estado actualizado correctamente.');
  } catch {
    toast.error('Error al actualizar el estado.');
  } finally {
    isSaving.value = false;
  }
}

// --- Exportar Asistencia ---
const selectedMes = ref((new Date().getMonth() + 1).toString());
const selectedSeccion = ref('');
const isExportingAsistencia = ref(false);

const meses = [
  { label: 'Marzo', value: '3' }, { label: 'Abril', value: '4' },
  { label: 'Mayo', value: '5' }, { label: 'Junio', value: '6' },
  { label: 'Julio', value: '7' }, { label: 'Agosto', value: '8' },
  { label: 'Septiembre', value: '9' }, { label: 'Octubre', value: '10' },
  { label: 'Noviembre', value: '11' }, { label: 'Diciembre', value: '12' },
];

async function handleExportAsistencia() {
  isExportingAsistencia.value = true;
  try {
    const blob = await asistenciaService.exportSiagie({
      mes: parseInt(selectedMes.value, 10),
      anioEscolarId: anioId.value,
      seccionId: selectedSeccion.value || undefined,
    });
    const mesNombre = meses.find(m => m.value === selectedMes.value)?.label || '';
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Asistencia_SIAGIE_${mesNombre}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Reporte generado y descargado correctamente');
  } catch {
    toast.error('Error al generar el reporte');
  } finally {
    isExportingAsistencia.value = false;
  }
}

// --- Exportar Notas ---
const expFilters = ref({ periodoId: '', seccionId: '' });
const isExportingNotas = ref(false);
const isClosing = ref(false);
const canExportNotas = computed(() => expFilters.value.periodoId && expFilters.value.seccionId);

async function handleExportNotas() {
  isExportingNotas.value = true;
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
    isExportingNotas.value = false;
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
