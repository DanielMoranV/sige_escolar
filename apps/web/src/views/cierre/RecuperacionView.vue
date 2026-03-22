<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Programa de Recuperación</h1>
        <p class="text-gray-500 mt-1">Registre las notas del examen de recuperación y recalcule la situación final.</p>
      </div>
    </div>

    <!-- Filtro sección -->
    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-end gap-4">
      <div class="flex-1">
        <BaseSelect
          v-model="filters.seccionId"
          label="Filtrar por Sección"
          :options="seccionesOptions"
        />
      </div>
      <BaseButton @click="loadEstudiantes" :loading="isLoading">Filtrar</BaseButton>
    </div>

    <!-- Lista de estudiantes en recuperación -->
    <div v-if="estudiantes.length" class="space-y-4">
      <div
        v-for="est in estudiantes"
        :key="est.matricula_id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <!-- Cabecera del estudiante -->
        <div
          class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
          @click="toggleEstudiante(est.matricula_id)"
        >
          <div class="flex items-center gap-3">
            <ChevronDownIcon
              class="w-4 h-4 text-gray-400 transition-transform"
              :class="{ 'rotate-180': expandidos.has(est.matricula_id) }"
            />
            <div>
              <p class="font-semibold text-gray-900">
                {{ est.apellido_paterno }} {{ est.apellido_materno }}, {{ est.nombres }}
              </p>
              <p class="text-xs text-gray-500">{{ est.grado_nombre }} — {{ est.seccion_nombre }} · DNI: {{ est.dni }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 font-medium">
              {{ est.areas.length }} área{{ est.areas.length !== 1 ? 's' : '' }} en recuperación
            </span>
            <BaseBadge v-if="est.resultado_recuperacion" :variant="getResultadoVariant(est.resultado_recuperacion)">
              {{ est.resultado_recuperacion }}
            </BaseBadge>
          </div>
        </div>

        <!-- Contenido expandido -->
        <div v-if="expandidos.has(est.matricula_id)" class="border-t border-gray-100 divide-y divide-gray-100">
          <div v-for="area in est.areas" :key="area.area_id" class="px-5 py-4 space-y-3">
            <!-- Cabecera del área -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-gray-800">{{ area.area_nombre }}</span>
                <BaseBadge v-if="area.resultado_area" :variant="area.resultado_area === 'APROBADO' ? 'success' : 'danger'" class="text-[11px]">
                  {{ area.resultado_area }}
                </BaseBadge>
              </div>
              <BaseButton
                size="sm"
                :loading="isSavingArea(est.matricula_id, area.area_id)"
                @click="saveArea(est, area)"
              >
                Guardar área
              </BaseButton>
            </div>

            <!-- Grilla de competencias -->
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-100">
                    <th class="text-left text-xs font-medium text-gray-500 pb-2 pr-6 min-w-[220px]">Competencia</th>
                    <th class="text-center text-xs font-medium text-gray-500 pb-2 min-w-[140px]">Nota de recuperación</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="comp in area.competencias" :key="comp.competencia_id">
                    <td class="py-2 pr-6 text-gray-700 text-xs">{{ comp.nombre }}</td>
                    <td class="py-2 text-center">
                      <div class="flex justify-center">
                        <CalificativoInput
                          :nivel="est.nivel"
                          v-model:literal="comp.literal"
                          v-model:numerico="comp.numerico"
                          @change="markDirty(est.matricula_id, area.area_id)"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Botón recalcular -->
          <div class="px-5 py-4 bg-gray-50 flex items-center justify-between">
            <p class="text-xs text-gray-500">
              Guarde todas las áreas antes de recalcular el resultado final.
            </p>
            <BaseButton
              :loading="isRecalculando(est.matricula_id)"
              @click="recalcular(est)"
              :disabled="hasDirtyAreas(est.matricula_id)"
            >
              <RefreshCwIcon class="w-4 h-4" />
              Recalcular resultado
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!isLoading" class="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <p class="text-gray-500">
        No hay estudiantes en programa de recuperación.
        <template v-if="!hasCierre">
          Ejecute primero el Cierre de Año Escolar.
        </template>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ChevronDownIcon, RefreshCwIcon } from 'lucide-vue-next';
import { cierreService } from '../../api/services/cierre.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import { useNivelStore } from '../../stores/nivel.store';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import CalificativoInput from '../../components/ui/CalificativoInput.vue';

const nivelStore = useNivelStore();
const toast = useToast();

const anioId = ref('');
const filters = ref({ seccionId: '' });
const rawSecciones = ref<any[]>([]);
const estudiantes = ref<any[]>([]);
const isLoading = ref(false);
const hasCierre = ref(false);

const expandidos = ref(new Set<string>());
// Tracking de áreas con cambios sin guardar: key = `${matriculaId}:${areaId}`
const dirtyAreas = ref(new Set<string>());
// Tracking de áreas guardándose: key = `${matriculaId}:${areaId}`
const savingAreas = ref(new Set<string>());
// Tracking de estudiantes recalculándose
const recalculandoIds = ref(new Set<string>());

const seccionesOptions = computed(() => {
  const filtered = nivelStore.nivelActivo === 'TODOS'
    ? rawSecciones.value
    : rawSecciones.value.filter(s => s.nivel === nivelStore.nivelActivo);
  return [
    { label: 'Todas las secciones', value: '' },
    ...filtered.map(s => ({ label: `${s.grado_nombre} - ${s.nombre}`, value: s.id })),
  ];
});

onMounted(async () => {
  try {
    const anio = await schoolConfigService.getAnioEscolar();
    anioId.value = anio.id;
    const s = await schoolConfigService.getSecciones();
    rawSecciones.value = s;
    await loadEstudiantes();
  } catch {
    // silent
  }
});

async function loadEstudiantes() {
  if (!anioId.value) return;
  isLoading.value = true;
  expandidos.value.clear();
  dirtyAreas.value.clear();
  try {
    const data = await cierreService.getRecuperacion(anioId.value, filters.value.seccionId || undefined);
    estudiantes.value = data;
    hasCierre.value = true;
  } catch {
    toast.error('Error al cargar los estudiantes en recuperación');
  } finally {
    isLoading.value = false;
  }
}

function toggleEstudiante(matriculaId: string) {
  if (expandidos.value.has(matriculaId)) {
    expandidos.value.delete(matriculaId);
  } else {
    expandidos.value.add(matriculaId);
  }
  // Trigger reactivity
  expandidos.value = new Set(expandidos.value);
}

function markDirty(matriculaId: string, areaId: string) {
  dirtyAreas.value.add(`${matriculaId}:${areaId}`);
  dirtyAreas.value = new Set(dirtyAreas.value);
}

function hasDirtyAreas(matriculaId: string): boolean {
  for (const key of dirtyAreas.value) {
    if (key.startsWith(`${matriculaId}:`)) return true;
  }
  return false;
}

function isSavingArea(matriculaId: string, areaId: string): boolean {
  return savingAreas.value.has(`${matriculaId}:${areaId}`);
}

function isRecalculando(matriculaId: string): boolean {
  return recalculandoIds.value.has(matriculaId);
}

async function saveArea(est: any, area: any) {
  const key = `${est.matricula_id}:${area.area_id}`;
  savingAreas.value.add(key);
  savingAreas.value = new Set(savingAreas.value);
  try {
    const notas: Record<string, { literal: string | null; numerico: number | null }> = {};
    for (const comp of area.competencias) {
      notas[comp.competencia_id] = {
        literal: comp.literal ?? null,
        numerico: comp.numerico ?? null,
      };
    }
    await cierreService.saveNotasRecuperacion(est.matricula_id, area.area_id, notas);
    dirtyAreas.value.delete(key);
    dirtyAreas.value = new Set(dirtyAreas.value);
    toast.success(`Área "${area.area_nombre}" guardada`);
  } catch {
    toast.error(`Error al guardar el área "${area.area_nombre}"`);
  } finally {
    savingAreas.value.delete(key);
    savingAreas.value = new Set(savingAreas.value);
  }
}

async function recalcular(est: any) {
  recalculandoIds.value.add(est.matricula_id);
  recalculandoIds.value = new Set(recalculandoIds.value);
  try {
    const result = await cierreService.recalcularPostRecuperacion(est.matricula_id);
    // Actualizar el resultado en la lista local
    const idx = estudiantes.value.findIndex(e => e.matricula_id === est.matricula_id);
    if (idx !== -1) {
      estudiantes.value[idx].resultado_recuperacion = result.resultado_recuperacion;
      // Actualizar resultado_area por área
      for (const [areaId, resultadoArea] of Object.entries(result.areas_evaluadas)) {
        const area = estudiantes.value[idx].areas.find((a: any) => a.area_id === areaId);
        if (area) area.resultado_area = resultadoArea;
      }
    }
    const variant = result.resultado_recuperacion === 'PROMOVIDO' ? '✅' : '⚠️';
    toast.success(`${variant} Resultado: ${result.resultado_recuperacion}`);
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Error al recalcular el resultado');
  } finally {
    recalculandoIds.value.delete(est.matricula_id);
    recalculandoIds.value = new Set(recalculandoIds.value);
  }
}

function getResultadoVariant(resultado: string) {
  if (resultado === 'PROMOVIDO') return 'success';
  if (resultado === 'PERMANECE') return 'danger';
  return 'neutral';
}
</script>
