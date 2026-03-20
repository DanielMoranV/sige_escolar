<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Configuración Escolar</h1>
        <p class="text-gray-500 mt-1">Información general del año académico y régimen de evaluación.</p>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="i in 2" :key="i" class="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Año Escolar -->
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div class="flex items-center gap-3 text-blue-600">
          <CalendarIcon class="w-5 h-5" />
          <h2 class="font-semibold text-gray-900">Año Académico</h2>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Año</span>
            <span class="font-medium text-gray-900">{{ anioEscolar?.anio }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Inicio de clases</span>
            <span class="font-medium text-gray-900">{{ formatDate(anioEscolar?.fecha_inicio) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Fin de clases</span>
            <span class="font-medium text-gray-900">{{ formatDate(anioEscolar?.fecha_fin) }}</span>
          </div>
          <div class="flex justify-between text-sm pt-2 border-t">
            <span class="text-gray-500">Estado</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Activo</span>
          </div>
        </div>
      </div>

      <!-- Régimen -->
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div class="flex items-center gap-3 text-purple-600">
          <LayoutGridIcon class="w-5 h-5" />
          <h2 class="font-semibold text-gray-900">Régimen de Evaluación</h2>
        </div>
        <div class="space-y-4">
          <div v-for="r in regimen" :key="r.nivel" class="flex justify-between items-center text-sm">
            <span class="text-gray-600">{{ r.nivel }}</span>
            <span class="px-3 py-1 bg-gray-100 rounded-lg font-medium text-gray-800">{{ r.tipo_regimen }}</span>
          </div>
        </div>
      </div>

      <!-- Estadísticas rápidas o info adicional -->
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div class="flex items-center gap-3 text-amber-600">
          <InfoIcon class="w-5 h-5" />
          <h2 class="font-semibold text-gray-900">Información del Sistema</h2>
        </div>
        <p class="text-xs text-gray-500 leading-relaxed">
          La configuración del año escolar y el régimen de evaluación es establecida por el administrador del sistema al momento de la creación del colegio. 
          Si necesita modificar estos datos, por favor contacte con soporte técnico.
        </p>
      </div>

      <!-- Periodos -->
      <div class="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <ClockIcon class="w-5 h-5 text-indigo-600" />
          <h2 class="font-semibold text-gray-900">Cronograma de Periodos</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th class="px-6 py-3">Nivel</th>
                <th class="px-6 py-3">Periodo</th>
                <th class="px-6 py-3">Inicio</th>
                <th class="px-6 py-3">Fin</th>
                <th class="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="p in periodos" :key="p.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="nivelClass(p.nivel)">
                    {{ p.nivel }}
                  </span>
                </td>
                <td class="px-6 py-4 font-medium text-gray-900">{{ p.nombre }}</td>
                <td class="px-6 py-4 text-gray-600">{{ formatDate(p.fecha_inicio) }}</td>
                <td class="px-6 py-4 text-gray-600">{{ formatDate(p.fecha_fin) }}</td>
                <td class="px-6 py-4">
                  <span class="flex items-center gap-1.5" :class="estadoClass(p.estado)">
                    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {{ p.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  CalendarIcon, 
  ClockIcon, 
  LayoutGridIcon, 
  InfoIcon 
} from 'lucide-vue-next';
import { schoolConfigService } from '../../api/services/school-config.service';

const loading = ref(true);
const anioEscolar = ref<any>(null);
const periodos = ref<any[]>([]);
const regimen = ref<any[]>([]);

async function loadData() {
  try {
    const [anio, per, reg] = await Promise.all([
      schoolConfigService.getAnioEscolar(),
      schoolConfigService.getPeriodos(),
      schoolConfigService.getRegimen(),
    ]);
    anioEscolar.value = anio;
    periodos.value = per;
    regimen.value = reg;
  } catch (err) {
    console.error('Error cargando configuración:', err);
  } finally {
    loading.value = false;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function nivelClass(nivel: string) {
  if (nivel === 'PRIMARIA') return 'bg-blue-100 text-blue-700';
  if (nivel === 'SECUNDARIA') return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-700';
}

function estadoClass(estado: string) {
  if (estado === 'ACTIVO') return 'text-green-600 font-medium';
  if (estado === 'CERRADO') return 'text-gray-400';
  return 'text-blue-500';
}

onMounted(loadData);
</script>
