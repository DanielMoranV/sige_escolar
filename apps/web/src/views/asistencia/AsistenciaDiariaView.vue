<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Control de Asistencia</h1>
        <p class="text-gray-500 mt-1">Registre la asistencia diaria de los estudiantes por sección.</p>
      </div>
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
    </div>

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
        <div v-else-if="asistenciaData.length > 0" class="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
          <CheckCircleIcon class="w-4 h-4" />
          <span class="text-xs font-medium">Todo guardado</span>
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

      <BaseTable
        v-else
        :columns="headers"
        :data="asistenciaData"
      >
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
              :class="[
                row.estado === opt.value 
                  ? opt.activeClass 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-white'
              ]"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { SaveIcon, CheckCircleIcon, AlertCircleIcon, UsersIcon } from 'lucide-vue-next';
import { asistenciaService } from '../../api/services/asistencia.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseTable from '../../components/ui/BaseTable.vue';

const toast = useToast();

const selectedSeccion = ref('');
const selectedFecha = ref(new Date().toISOString().split('T')[0]);
const seccionesOptions = ref<any[]>([]);
const asistenciaData = ref<any[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const hasChanges = ref(false);

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

onMounted(async () => {
  const secc = await schoolConfigService.getSecciones();
  seccionesOptions.value = secc.map((s: any) => ({
    label: `${s.grado_nombre} - ${s.nombre}`,
    value: s.id
  }));
});

watch([selectedSeccion, selectedFecha], () => {
  if (selectedSeccion.value && selectedFecha.value) {
    loadAsistencia();
  }
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
  asistenciaData.value.forEach(item => {
    item.estado = 'PRESENTE';
  });
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
    hasChanges.value = false;
    toast.success('Asistencia guardada correctamente');
  } catch {
    toast.error('Error al guardar asistencia');
  } finally {
    isSaving.value = false;
  }
}
</script>
