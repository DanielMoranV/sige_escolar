<template>
  <div class="space-y-6">
    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseSelect
        v-model="seccionId"
        label="Seleccionar Sección"
        :options="seccionesOptions"
      />
      <div class="flex items-end pb-1">
        <BaseButton class="w-full" :loading="isLoading" @click="loadRendimiento" :disabled="!seccionId">
          <BarChartIcon class="w-4 h-4" />
          Analizar Rendimiento
        </BaseButton>
      </div>
    </div>

    <div v-if="rendimiento.length" class="grid grid-cols-1 gap-6">
      <div v-for="item in rendimiento" :key="item.area" class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 class="font-bold text-gray-800 mb-4">{{ item.area }}</h3>
        
        <div class="space-y-3">
          <div v-for="nivel in niveles" :key="nivel.key" class="space-y-1">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-gray-600">{{ nivel.label }}</span>
              <span class="text-gray-900">{{ item[nivel.key] }} est.</span>
            </div>
            <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-1000"
                :class="nivel.color"
                :style="{ width: `${(item[nivel.key] / getTotal(item)) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="hasLoaded" class="text-center py-12">
      <p class="text-gray-500">No hay datos de rendimiento para esta sección.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { BarChartIcon } from 'lucide-vue-next';
import { schoolConfigService } from '../../../api/services/school-config.service';
import { reportesService } from '../../../api/services/reportes.service';
import { useNivelStore } from '../../../stores/nivel.store';
import BaseSelect from '../../../components/ui/BaseSelect.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';

const nivelStore = useNivelStore();
const seccionId = ref('');
const rawSecciones = ref<any[]>([]);
const seccionesOptions = computed(() => {
  const filtered = nivelStore.nivelActivo === 'TODOS'
    ? rawSecciones.value
    : rawSecciones.value.filter(s => s.nivel === nivelStore.nivelActivo);
  return filtered.map(s => ({ label: `${s.grado_nombre} - ${s.nombre}`, value: s.id }));
});
const isLoading = ref(false);
const hasLoaded = ref(false);
const rendimiento = ref<any[]>([]);

const niveles = [
  { key: 'nivel_destacado', label: 'Logro Destacado (AD / 18-20)', color: 'bg-blue-600' },
  { key: 'nivel_esperado', label: 'Logro Esperado (A / 14-17)', color: 'bg-green-500' },
  { key: 'nivel_proceso', label: 'En Proceso (B / 11-13)', color: 'bg-yellow-500' },
  { key: 'nivel_inicio', label: 'En Inicio (C / 0-10)', color: 'bg-red-500' },
];

onMounted(async () => {
  rawSecciones.value = await schoolConfigService.getSecciones();
});

async function loadRendimiento() {
  isLoading.value = true;
  try {
    rendimiento.value = await reportesService.getSeccionRendimiento(seccionId.value);
    hasLoaded.value = true;
  } catch (err) {
    alert('Error al cargar rendimiento');
  } finally {
    isLoading.value = false;
  }
}

function getTotal(item: any) {
  const total = item.nivel_destacado + item.nivel_esperado + item.nivel_proceso + item.nivel_inicio;
  return total || 1;
}
</script>
