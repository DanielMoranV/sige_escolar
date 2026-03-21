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
        <BaseButton :loading="isCalculating" @click="handleCalcular">
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

    <!-- Modal Caso Especial -->
    <BaseModal :show="showModal" @close="showModal = false" title="Modificar Situación Final (Caso Especial)">
      <div class="space-y-4" v-if="selectedRow">
        <div class="p-3 bg-gray-50 rounded border text-sm">
          <p><strong>Estudiante:</strong> {{ selectedRow.nombres }} {{ selectedRow.apellido_paterno }}</p>
          <p><strong>Situación actual del sistema:</strong> {{ selectedRow.resultado }}</p>
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
import { ref, onMounted } from 'vue';
import { DownloadIcon, CalculatorIcon } from 'lucide-vue-next';
import { cierreService } from '../../api/services/cierre.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseTable from '../../components/ui/BaseTable.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import BaseInput from '../../components/ui/BaseInput.vue';

const anioId = ref('');
const filters = ref({ seccionId: '' });
const seccionesOptions = ref<any[]>([]);
const resultados = ref<any[]>([]);
const isLoading = ref(false);
const isCalculating = ref(false);
const isExporting = ref(false);

// Modal state
const showModal = ref(false);
const selectedRow = ref<any>(null);
const isSavingEspecial = ref(false);
const especialForm = ref({ resultado: '', justificacion: '' });

const columns = [
  { key: 'estudiante', label: 'Estudiante' },
  { key: 'grado_seccion', label: 'Grado y Sección' },
  { key: 'resultado', label: 'Situación Final' },
  { key: 'acciones', label: 'Acciones' },
];

onMounted(async () => {
  try {
    const anio = await schoolConfigService.getAnioEscolar();
    anioId.value = anio.id;
    const s = await schoolConfigService.getSecciones();
    seccionesOptions.value = [
      { label: 'Todas las secciones', value: '' },
      ...s.map((item: any) => ({ label: `${item.grado_nombre} - ${item.nombre}`, value: item.id }))
    ];
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
  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
}

async function handleCalcular() {
  if (!confirm('Esta acción recalculará la situación final de todos los estudiantes usando las notas actuales. ¿Desea continuar?')) return;
  isCalculating.value = true;
  try {
    await cierreService.calcularCierre(anioId.value);
    alert('Cálculo completado exitosamente.');
    await loadResultados();
  } catch (err) {
    alert('Error al calcular el cierre.');
  } finally {
    isCalculating.value = false;
  }
}

async function handleExport() {
  isExporting.value = true;
  try {
    await cierreService.exportExcel(anioId.value);
    alert('Archivo Excel para SIAGIE generado. Vaya a "Panel SIAGIE" para descargarlo y confirmar su carga.');
  } catch (err) {
    alert('Error al generar la exportación.');
  } finally {
    isExporting.value = false;
  }
}

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
    alert('Caso especial guardado correctamente.');
  } catch (err) {
    alert('Error al guardar.');
  } finally {
    isSavingEspecial.value = false;
  }
}
</script>
