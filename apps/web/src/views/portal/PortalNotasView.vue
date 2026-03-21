<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { portalService } from '@/api/services/portal.service';
import { schoolConfigService } from '@/api/services/school-config.service';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';

const periodos = ref<any[]>([]);
const selectedPeriodo = ref('');
const notasData = ref<any>(null);
const loading = ref(false);

onMounted(async () => {
  try {
    periodos.value = await schoolConfigService.getPeriodos();
    const activo = periodos.value.find(p => p.estado === 'ACTIVO');
    if (activo) {
      selectedPeriodo.value = activo.id;
      loadNotas();
    }
  } catch (error) {
    console.error('Error al cargar periodos', error);
  }
});

const loadNotas = async () => {
  if (!selectedPeriodo.value) return;
  loading.value = true;
  try {
    notasData.value = await portalService.getNotas(selectedPeriodo.value);
  } catch (error) {
    console.error('Error al cargar notas', error);
  } finally {
    loading.value = false;
  }
};

const getNotaType = (nota: any) => {
  if (typeof nota === 'number') {
    if (nota >= 18) return 'ad';
    if (nota >= 14) return 'a';
    if (nota >= 11) return 'b';
    return 'c';
  }
  return nota.toLowerCase();
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h1 class="text-xl font-bold text-gray-800">Notas por Periodo</h1>
      <div class="w-64">
        <BaseSelect
          v-model="selectedPeriodo"
          :options="periodos.map(p => ({ label: p.nombre, value: p.id }))"
          @change="loadNotas"
          placeholder="Seleccionar periodo"
        />
      </div>
    </div>

    <div v-if="loading" class="animate-pulse space-y-4">
      <div v-for="i in 5" :key="i" class="h-16 bg-gray-200 rounded-lg"></div>
    </div>

    <div v-else-if="notasData?.notas?.length" class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área / Competencia</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nota</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logros y Sugerencias</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="(nota, index) in notasData.notas" :key="index">
            <td class="px-6 py-4">
              <div class="text-sm font-semibold text-gray-900">{{ nota.area }}</div>
              <div class="text-xs text-gray-500">{{ nota.competencia }}</div>
            </td>
            <td class="px-6 py-4 text-center">
              <BaseBadge :type="getNotaType(nota.calificativo_literal || nota.calificativo_numerico)">
                {{ nota.calificativo_literal || nota.calificativo_numerico || '-' }}
              </BaseBadge>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ nota.conclusion_descriptiva || 'Sin comentario registrado.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="selectedPeriodo" class="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
      <p class="text-gray-500">No hay notas registradas para este periodo todavía.</p>
    </div>
  </div>
</template>
