<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Panel de Sincronización SIAGIE</h1>
      <p class="text-gray-500 mt-1">Historial de exportaciones y control de carga en el sistema del MINEDU.</p>
    </div>

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
        <p class="text-sm text-gray-600">
          ¿El archivo fue procesado correctamente por el sistema SIAGIE?
        </p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { DownloadIcon } from 'lucide-vue-next';
import { siagieService } from '../../api/services/siagie.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import BaseTable from '../../components/ui/BaseTable.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseInput from '../../components/ui/BaseInput.vue';

const anioId = ref('');
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

onMounted(async () => {
  try {
    const anio = await schoolConfigService.getAnioEscolar();
    anioId.value = anio.id;
    await loadLogs();
  } catch (error) {
    console.error(error);
  }
});

async function loadLogs() {
  if (!anioId.value) return;
  isLoading.value = true;
  try {
    const response = await siagieService.getSyncLog(anioId.value);
    logs.value = response.data || [];
  } catch (err) {
    console.error(err);
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
    alert('Estado actualizado correctamente.');
  } catch (err) {
    alert('Error al actualizar el estado.');
  } finally {
    isSaving.value = false;
  }
}
</script>
