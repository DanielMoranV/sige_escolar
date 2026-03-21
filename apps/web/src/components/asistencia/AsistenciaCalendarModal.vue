<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="$emit('close')"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 class="text-lg font-bold text-gray-900">Historial de Asistencia</h2>
            <p class="text-sm text-gray-500 mt-0.5">{{ studentName }}</p>
          </div>
          <button @click="$emit('close')" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div v-if="loading" class="flex justify-center items-center py-16">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>

          <div v-else>
            <!-- Leyenda -->
            <div class="flex flex-wrap gap-3 mb-6">
              <div v-for="est in estados" :key="est.value" class="flex items-center gap-1.5 text-xs text-gray-600">
                <span class="w-3 h-3 rounded-sm inline-block" :class="est.bg"></span>
                {{ est.label }}
              </div>
              <div class="flex items-center gap-1.5 text-xs text-gray-400">
                <span class="w-3 h-3 rounded-sm inline-block bg-gray-100 border border-gray-200"></span>
                Sin registro
              </div>
            </div>

            <!-- Estadísticas rápidas -->
            <div class="grid grid-cols-5 gap-2 mb-6">
              <div v-for="est in estados" :key="est.value" class="bg-gray-50 rounded-lg p-2 text-center">
                <p class="text-xl font-bold" :class="est.text">{{ conteo[est.value] ?? 0 }}</p>
                <p class="text-[10px] text-gray-500 leading-tight mt-0.5">{{ est.short }}</p>
              </div>
            </div>

            <!-- Calendario por meses -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="mes in meses"
                :key="mes.key"
                class="bg-gray-50 rounded-xl p-3"
              >
                <p class="text-xs font-semibold text-gray-700 mb-2 text-center uppercase tracking-wide">
                  {{ mes.nombre }}
                </p>
                <!-- Cabecera días de la semana -->
                <div class="grid grid-cols-7 gap-0.5 mb-1">
                  <div v-for="d in ['D','L','M','M','J','V','S']" :key="d" class="text-center text-[9px] font-bold text-gray-400">{{ d }}</div>
                </div>
                <!-- Semanas -->
                <div class="space-y-0.5">
                  <div v-for="(semana, si) in mes.semanas" :key="si" class="grid grid-cols-7 gap-0.5">
                    <div
                      v-for="(dia, di) in semana"
                      :key="di"
                      class="aspect-square flex items-center justify-center rounded text-[10px] font-medium transition-all"
                      :class="diaClass(dia)"
                      :title="dia ? diaTooltip(dia) : ''"
                    >
                      {{ dia?.day ?? '' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { XIcon } from 'lucide-vue-next';
import { asistenciaService } from '../../api/services/asistencia.service';

interface DiaCalendario {
  day: number;
  dateStr: string;
  estado: string | null;
  isFuture: boolean;
  isWeekend: boolean;
}

const props = defineProps<{
  show: boolean;
  matriculaId: string | null;
  studentName: string;
}>();

defineEmits<{ (e: 'close'): void }>();

const loading = ref(false);
const fechaInicio = ref<string | null>(null);
const fechaFin = ref<string | null>(null);
const registrosMap = ref(new Map<string, string>());

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const estados = [
  { value: 'PRESENTE',           label: 'Presente',             short: 'Presente',  bg: 'bg-green-500', text: 'text-green-600' },
  { value: 'TARDANZA',           label: 'Tardanza',             short: 'Tardanza',  bg: 'bg-amber-500', text: 'text-amber-600' },
  { value: 'FALTA_INJUSTIFICADA',label: 'Falta Injustificada',  short: 'F. Injust.',bg: 'bg-red-500',   text: 'text-red-600'   },
  { value: 'FALTA_JUSTIFICADA',  label: 'Falta Justificada',    short: 'F. Just.',  bg: 'bg-blue-500',  text: 'text-blue-600'  },
  { value: 'LICENCIA',           label: 'Licencia',             short: 'Licencia',  bg: 'bg-purple-500',text: 'text-purple-600'},
];

const conteo = computed(() => {
  const c: Record<string, number> = {};
  for (const estado of registrosMap.value.values()) {
    c[estado] = (c[estado] ?? 0) + 1;
  }
  return c;
});

const meses = computed(() => {
  if (!fechaInicio.value) return [];

  const inicio = new Date(fechaInicio.value + 'T00:00:00');
  const fin = fechaFin.value ? new Date(fechaFin.value + 'T00:00:00') : new Date();
  const result: { key: string; nombre: string; semanas: (DiaCalendario | null)[][] }[] = [];

  let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  const limiteMax = new Date(fin.getFullYear(), fin.getMonth(), 1);

  while (cursor <= limiteMax) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    result.push({
      key: `${year}-${month}`,
      nombre: `${MONTH_NAMES[month]} ${year}`,
      semanas: generarSemanas(year, month),
    });
    cursor = new Date(year, month + 1, 1);
  }

  return result;
});

function generarSemanas(year: number, month: number): (DiaCalendario | null)[][] {
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const startDow = primerDia.getDay(); // 0=Dom
  const semanas: (DiaCalendario | null)[][] = [];
  let semana: (DiaCalendario | null)[] = Array(startDow).fill(null);

  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const fecha = new Date(year, month, d);
    fecha.setHours(0, 0, 0, 0);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    semana.push({
      day: d,
      dateStr,
      estado: registrosMap.value.get(dateStr) ?? null,
      isFuture: fecha > hoy,
      isWeekend: fecha.getDay() === 0 || fecha.getDay() === 6,
    });
    if (semana.length === 7) {
      semanas.push(semana);
      semana = [];
    }
  }

  if (semana.length > 0) {
    while (semana.length < 7) semana.push(null);
    semanas.push(semana);
  }

  return semanas;
}

function diaClass(dia: DiaCalendario | null) {
  if (!dia) return '';
  if (dia.isFuture) return 'text-gray-300';
  if (dia.isWeekend && !dia.estado) return 'text-gray-300';

  switch (dia.estado) {
    case 'PRESENTE':            return 'bg-green-500 text-white';
    case 'TARDANZA':            return 'bg-amber-500 text-white';
    case 'FALTA_INJUSTIFICADA': return 'bg-red-500 text-white';
    case 'FALTA_JUSTIFICADA':   return 'bg-blue-500 text-white';
    case 'LICENCIA':            return 'bg-purple-500 text-white';
    default:                    return 'bg-gray-100 text-gray-400';
  }
}

function diaTooltip(dia: DiaCalendario) {
  if (dia.isFuture) return '';
  const label = estados.find(e => e.value === dia.estado)?.label ?? 'Sin registro';
  return `${dia.dateStr}: ${label}`;
}

watch(() => props.show, async (val) => {
  if (!val || !props.matriculaId) return;
  loading.value = true;
  registrosMap.value = new Map();
  try {
    const res = await asistenciaService.getHistorialEstudiante(props.matriculaId);
    fechaInicio.value = res.fechaInicio;
    fechaFin.value = res.fechaFin;
    const map = new Map<string, string>();
    for (const r of res.registros) {
      // fecha can come as "2026-03-01" or "2026-03-01T00:00:00.000Z"
      map.set(r.fecha.substring(0, 10), r.estado);
    }
    registrosMap.value = map;
  } finally {
    loading.value = false;
  }
});
</script>
