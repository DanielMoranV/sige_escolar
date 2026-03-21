<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Registro de Calificaciones</h1>
        <p class="text-gray-500 mt-1">Seleccione los filtros para cargar la grilla de evaluación.</p>
      </div>
      <div v-if="hasChanges" class="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100 text-xs font-medium animate-pulse">
        <SaveIcon class="w-3 h-3" />
        Cambios pendientes...
      </div>
      <div v-else-if="lastSaved" class="text-xs text-gray-400">
        Guardado a las {{ lastSaved }}
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <BaseSelect
        v-model="filters.periodoId"
        label="Periodo"
        :options="periodosOptions"
      />
      <BaseSelect
        v-model="filters.areaId"
        label="Área Curricular"
        :options="areasOptions"
      />
      <BaseSelect
        v-model="filters.seccionId"
        label="Grado y Sección"
        :options="seccionesOptions"
      />
      <div class="flex items-end pb-1">
        <BaseButton class="w-full" :loading="isLoading" @click="cargarGrilla" :disabled="!canLoad">
          <SearchIcon class="w-4 h-4" />
          Cargar Grilla
        </BaseButton>
      </div>
    </div>

    <!-- Grilla -->
    <div v-if="grillaData" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-64 sticky left-0 bg-gray-50 z-10 border-r">Estudiante</th>
            <th 
              v-for="comp in grillaData.competencias" 
              :key="comp.id"
              class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase min-w-[150px]"
            >
              <div class="flex flex-col gap-1">
                <span class="truncate w-32 mx-auto" :title="comp.nombre_display">{{ comp.nombre_display }}</span>
                <span class="text-[10px] text-gray-400 lowercase font-normal italic">Competencia {{ comp.orden }}</span>
              </div>
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase min-w-[250px]">Conclusión Descriptiva</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 bg-white">
          <tr v-for="est in grillaData.estudiantes" :key="est.matricula_id" class="hover:bg-blue-50/30 transition-colors">
            <td class="px-4 py-3 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 border-r">
              <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-900 truncate w-56">{{ est.apellido_paterno }} {{ est.apellido_materno }}, {{ est.nombres }}</span>
                <span class="text-[10px] text-gray-500">DNI: {{ est.dni }}</span>
              </div>
            </td>
            <td v-for="(nota, idx) in est.notas" :key="nota.competenciaIeId" class="px-4 py-3 text-center">
              <div class="flex justify-center">
                <CalificativoInput
                  :nivel="nivelActual"
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
                @input="markChanges"
                placeholder="Evidencia de aprendizaje..."
                class="w-full text-xs border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none py-1"
              ></textarea>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading" class="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 text-gray-400 shadow-sm">
        <LayoutGridIcon class="w-8 h-8" />
      </div>
      <h3 class="text-gray-900 font-medium">Grilla no cargada</h3>
      <p class="text-gray-500 text-sm max-w-xs mx-auto mt-1">Seleccione el periodo, área y sección para comenzar a registrar notas.</p>
    </div>

    <!-- Manual Save Button (as backup for auto-save) -->
    <div v-if="grillaData" class="flex justify-end">
      <BaseButton :loading="isSaving" @click="saveAll" :disabled="!hasChanges">
        <SaveIcon class="w-4 h-4" />
        Guardar Todo
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { 
  SearchIcon, 
  LayoutGridIcon, 
  SaveIcon,
  CheckCircleIcon
} from 'lucide-vue-next';
import { schoolConfigService } from '../../api/services/school-config.service';
import { notasService } from '../../api/services/notas.service';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import CalificativoInput from '../../components/ui/CalificativoInput.vue';

const filters = ref({
  periodoId: '',
  areaId: '',
  seccionId: '',
});

const periodosOptions = ref<any[]>([]);
const areasOptions = ref<any[]>([]);
const seccionesOptions = ref<any[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const grillaData = ref<any>(null);
const hasChanges = ref(false);
const lastSaved = ref('');

const canLoad = computed(() => filters.value.periodoId && filters.value.areaId && filters.value.seccionId);

const nivelActual = computed(() => {
  if (!filters.value.seccionId) return 'PRIMARIA';
  const secc = seccionesOptions.value.find(s => s.value === filters.value.seccionId);
  return secc?.nivel || 'PRIMARIA';
});

onMounted(async () => {
  try {
    const [p, a, s] = await Promise.all([
      schoolConfigService.getPeriodos(),
      schoolConfigService.getAreas(),
      schoolConfigService.getSecciones(),
    ]);
    periodosOptions.value = p.map((item: any) => ({ label: item.nombre, value: item.id }));
    areasOptions.value = a.map((item: any) => ({ label: item.nombre_display, value: item.id }));
    seccionesOptions.value = s.map((item: any) => ({ 
      label: `${item.grado_nombre} - ${item.nombre}`, 
      value: item.id,
      nivel: item.nivel
    }));
  } catch (err) {
    console.error(err);
  }
});

async function cargarGrilla() {
  isLoading.value = true;
  try {
    const data = await notasService.getGrilla(filters.value);
    // Mappear conclusion para el textarea local
    data.estudiantes = data.estudiantes.map((est: any) => ({
      ...est,
      conclusion: est.notas[0]?.conclusionDescriptiva || ''
    }));
    grillaData.value = data;
    hasChanges.value = false;
  } catch (err) {
    alert('Error al cargar la grilla');
  } finally {
    isLoading.value = false;
  }
}

function markChanges() {
  hasChanges.value = true;
}

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
          conclusionDescriptiva: est.conclusion, // Usamos la misma conclusion para todas las notas de esa fila por ahora (estándar SIAGIE)
        }))
      )
    };
    await notasService.saveGrilla(payload);
    hasChanges.value = false;
    lastSaved.value = new Date().toLocaleTimeString();
  } catch (err) {
    alert('Error al guardar las notas');
  } finally {
    isSaving.value = false;
  }
}

// Auto-save logic (debounce)
let autoSaveTimer: any = null;
import { watch } from 'vue';
watch(hasChanges, (val) => {
  if (val) {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveAll();
    }, 5000); // 5 seconds
  }
});

onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
});
</script>
