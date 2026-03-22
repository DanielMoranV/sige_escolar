<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Cierre de Año Escolar</h1>
        <p class="text-gray-500 mt-1">Calcule la situación final de los estudiantes (Promovido, Recuperación, Repite).</p>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="secondary" :loading="isExporting" @click="handleExport" :disabled="!resultados.length">
          <DownloadIcon class="w-4 h-4" /> Exportar Actas
        </BaseButton>
        <BaseButton :loading="isCalculating" @click="showConfirmCalculo = true">
          <CalculatorIcon class="w-4 h-4" /> Calcular Cierre Anual
        </BaseButton>
      </div>
    </div>

    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-end gap-4">
      <div class="flex-1">
        <BaseSelect
          v-model="filters.seccionId"
          label="Filtrar por Sección"
          :options="seccionesOptions"
        />
      </div>
      <BaseButton @click="loadResultados" :loading="isLoading">Filtrar</BaseButton>
    </div>

    <div v-if="resultados.length" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <BaseTable :columns="columns" :data="resultados">
        <template #cell-estudiante="{ row }">
          <span class="font-medium text-gray-900">{{ row.apellido_paterno }} {{ row.apellido_materno }}, {{ row.nombres }}</span>
          <span v-if="row.es_caso_especial" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800" title="Modificado manualmente">Especial</span>
        </template>
        <template #cell-grado_seccion="{ row }">
          <span class="text-sm text-gray-600">{{ row.grado_nombre }} - {{ row.seccion_nombre }}</span>
        </template>
        <template #cell-resultado="{ row }">
          <BaseBadge :variant="getResultadoVariant(row.resultado)">{{ row.resultado }}</BaseBadge>
        </template>
        <template #cell-areas_recuperacion="{ row }">
          <template v-if="row.areas_recuperacion?.length">
            <span
              v-for="area in row.areas_recuperacion"
              :key="area"
              class="inline-block mr-1 mb-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded"
            >{{ area }}</span>
          </template>
          <span v-else class="text-gray-400 text-xs">—</span>
        </template>
        <template #cell-acciones="{ row }">
          <BaseButton size="sm" variant="secondary" @click="abrirModalEspecial(row)">
            Revisar Caso
          </BaseButton>
        </template>
      </BaseTable>
    </div>
    <div v-else-if="!isLoading" class="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <p class="text-gray-500">No hay resultados generados. Haga clic en "Calcular Cierre Anual" para procesar las notas.</p>
    </div>

    <!-- Modal Confirmación Calcular -->
    <BaseModal :show="showConfirmCalculo" @close="showConfirmCalculo = false" title="Calcular Cierre Anual">
      <p class="text-sm text-gray-600">Esta acción recalculará la situación final de todos los estudiantes usando las notas actuales. Los resultados existentes serán sobreescritos. ¿Desea continuar?</p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" @click="showConfirmCalculo = false">Cancelar</BaseButton>
          <BaseButton :loading="isCalculating" @click="handleCalcular">Calcular</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Modal Caso Especial -->
    <BaseModal :show="showModal" @close="showModal = false" title="Modificar Situación Final (Caso Especial)">
      <div class="space-y-4" v-if="selectedRow">
        <div class="p-3 bg-gray-50 rounded border text-sm space-y-1">
          <p><strong>Estudiante:</strong> {{ selectedRow.apellido_paterno }} {{ selectedRow.apellido_materno }}, {{ selectedRow.nombres }}</p>
          <p><strong>Grado:</strong> {{ selectedRow.grado_nombre }} – {{ selectedRow.seccion_nombre }}</p>
          <p><strong>Situación calculada:</strong>
            <BaseBadge class="ml-1" :variant="getResultadoVariant(selectedRow.resultado)">{{ selectedRow.resultado }}</BaseBadge>
          </p>
        </div>

        <!-- Promedios anuales por área -->
        <div v-if="promediosDelRow.length" class="text-sm">
          <p class="font-medium text-gray-700 mb-1.5">Promedios anuales por área:</p>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1">
            <div v-for="area in promediosDelRow" :key="area.nombre" class="flex justify-between border-b border-gray-100 pb-0.5">
              <span class="text-gray-600 truncate pr-2">{{ area.nombre }}</span>
              <span :class="['font-semibold text-xs', area.esDeficit ? 'text-red-600' : 'text-gray-800']">
                {{ area.literal ?? area.numerico }}
              </span>
            </div>
          </div>
        </div>

        <BaseSelect
          v-model="especialForm.resultado"
          label="Nueva Situación"
          :options="[
            { label: 'PROMOVIDO', value: 'PROMOVIDO' },
            { label: 'PERMANECE', value: 'PERMANECE' },
            { label: 'RECUPERACION', value: 'RECUPERACION' },
            { label: 'POSTERGADO', value: 'POSTERGADO' }
          ]"
        />
        <BaseInput
          v-model="especialForm.justificacion"
          label="Justificación Administrativa (Requerido)"
          placeholder="Ej: Resolución Directoral N°..."
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton @click="guardarCasoEspecial" :loading="isSavingEspecial" :disabled="!especialForm.justificacion">Guardar Modificación</BaseButton>
        </div>
      </template>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { DownloadIcon, CalculatorIcon } from 'lucide-vue-next';
import { cierreService } from '../../api/services/cierre.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import { useNivelStore } from '../../stores/nivel.store';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseTable from '../../components/ui/BaseTable.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import BaseInput from '../../components/ui/BaseInput.vue';

const nivelStore = useNivelStore();
const toast = useToast();
const anioId = ref('');
const filters = ref({ seccionId: '' });
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
const resultados = ref<any[]>([]);
const isLoading = ref(false);
const isCalculating = ref(false);
const isExporting = ref(false);

// Modal confirmación cálculo
const showConfirmCalculo = ref(false);

// Modal caso especial
const showModal = ref(false);
const selectedRow = ref<any>(null);
const isSavingEspecial = ref(false);
const especialForm = ref({ resultado: '', justificacion: '' });

const columns = [
  { key: 'estudiante', label: 'Estudiante' },
  { key: 'grado_seccion', label: 'Grado y Sección' },
  { key: 'resultado', label: 'Situación Final' },
  { key: 'areas_recuperacion', label: 'Áreas con déficit' },
  { key: 'acciones', label: 'Acciones' },
];

onMounted(async () => {
  try {
    const anio = await schoolConfigService.getAnioEscolar();
    anioId.value = anio.id;
    const s = await schoolConfigService.getSecciones();
    rawSecciones.value = s;
    await loadResultados();
  } catch (error) {
    console.error(error);
  }
});

async function loadResultados() {
  if (!anioId.value) return;
  isLoading.value = true;
  try {
    resultados.value = await cierreService.getResultado(anioId.value, filters.value.seccionId || undefined);
  } catch {
    toast.error('Error al cargar los resultados');
  } finally {
    isLoading.value = false;
  }
}

async function handleCalcular() {
  showConfirmCalculo.value = false;
  isCalculating.value = true;
  try {
    await cierreService.calcularCierre(anioId.value);
    toast.success('Cierre de año calculado correctamente');
    await loadResultados();
  } catch {
    toast.error('Error al calcular el cierre');
  } finally {
    isCalculating.value = false;
  }
}

async function handleExport() {
  isExporting.value = true;
  try {
    const blob = await cierreService.exportExcel(anioId.value);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cierre_Anual_SIAGIE_${anioId.value}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Archivo Excel descargado correctamente');
  } catch {
    toast.error('Error al generar la exportación');
  } finally {
    isExporting.value = false;
  }
}

// Desglose de promedios del estudiante seleccionado para mostrar en el modal
const promediosDelRow = computed(() => {
  if (!selectedRow.value?.promedios_areas) return [];
  const areasDeficit: string[] = selectedRow.value.areas_recuperacion ?? [];
  return Object.entries(selectedRow.value.promedios_areas as Record<string, { literal: string | null; numerico: number | null }>)
    .map(([nombre, val]) => ({
      nombre,
      literal: val.literal,
      numerico: val.numerico,
      esDeficit: areasDeficit.includes(nombre),
    }));
});

function getResultadoVariant(resultado: string) {
  if (resultado === 'PROMOVIDO') return 'success';
  if (resultado === 'RECUPERACION') return 'warning';
  if (resultado === 'PERMANECE') return 'danger';
  return 'neutral';
}

function abrirModalEspecial(row: any) {
  selectedRow.value = row;
  especialForm.value = { resultado: row.resultado, justificacion: row.justificacion_caso || '' };
  showModal.value = true;
}

async function guardarCasoEspecial() {
  isSavingEspecial.value = true;
  try {
    await cierreService.setCasoEspecial(selectedRow.value.matricula_id, especialForm.value);
    showModal.value = false;
    await loadResultados();
    toast.success('Caso especial guardado correctamente');
  } catch {
    toast.error('Error al guardar el caso especial');
  } finally {
    isSavingEspecial.value = false;
  }
}
</script>
