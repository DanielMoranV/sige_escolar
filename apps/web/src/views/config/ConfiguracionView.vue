<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Configuración</h1>
        <p class="text-gray-500 mt-1">Año académico, régimen de evaluación y gestión de aulas.</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="pb-4 text-sm font-medium transition-colors relative"
          :class="activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'"
        >
          {{ tab.label }}
          <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
        </button>
      </nav>
    </div>

    <!-- Tab: General -->
    <template v-if="activeTab === 'general'">
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

        <!-- Info -->
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
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="nivelClass(p.nivel)">{{ p.nivel }}</span>
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
    </template>

    <!-- Tab: Aulas -->
    <template v-if="activeTab === 'aulas'">
      <div class="flex justify-end">
        <BaseButton @click="openCreate">
          <PlusIcon class="w-4 h-4" />
          Nueva Sección
        </BaseButton>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div v-if="aulasLoading" class="p-12 text-center">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        </div>

        <table v-else class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th class="px-6 py-3">Grado / Sección</th>
              <th class="px-6 py-3 hidden sm:table-cell">Nivel</th>
              <th class="px-6 py-3 hidden md:table-cell">Turno</th>
              <th class="px-6 py-3 hidden lg:table-cell">Tutor</th>
              <th class="px-6 py-3 hidden md:table-cell text-center">Matric.</th>
              <th class="px-6 py-3 hidden md:table-cell text-center">Aforo</th>
              <th class="px-6 py-3 text-center">Estado</th>
              <th class="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="!secciones.length">
              <td colspan="8" class="px-6 py-10 text-center text-gray-500">No hay secciones registradas.</td>
            </tr>
            <tr v-for="sec in secciones" :key="sec.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {{ sec.grado_nombre?.[0] }}{{ sec.nombre }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ sec.grado_nombre }}</p>
                    <p class="text-xs text-gray-500">Sección {{ sec.nombre }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 hidden sm:table-cell">
                <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="sec.nivel === 'PRIMARIA' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'">{{ sec.nivel }}</span>
              </td>
              <td class="px-6 py-4 hidden md:table-cell text-gray-600">{{ sec.turno }}</td>
              <td class="px-6 py-4 hidden lg:table-cell text-gray-600">{{ sec.tutor_nombre || '—' }}</td>
              <td class="px-6 py-4 hidden md:table-cell text-center font-medium text-gray-900">{{ sec.total_matriculados ?? 0 }}</td>
              <td class="px-6 py-4 hidden md:table-cell text-center text-gray-600">{{ sec.aforo_maximo || '—' }}</td>
              <td class="px-6 py-4 text-center">
                <BaseBadge :variant="sec.activa ? 'success' : 'neutral'">{{ sec.activa ? 'Activa' : 'Inactiva' }}</BaseBadge>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openEdit(sec)" class="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                    <EditIcon class="w-4 h-4" />
                  </button>
                  <button @click="toggleActiva(sec)" class="p-1.5 rounded-lg transition-colors"
                    :class="sec.activa ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' : 'text-gray-500 hover:text-green-600 hover:bg-green-50'"
                    :title="sec.activa ? 'Desactivar' : 'Activar'">
                    <EyeOffIcon v-if="sec.activa" class="w-4 h-4" />
                    <EyeIcon v-else class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Aulas -->
      <BaseModal :show="showAulaModal" :title="editingId ? 'Editar Sección' : 'Nueva Sección'" @close="closeAulaModal">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Grado <span class="text-red-500">*</span></label>
            <select v-model="aulaForm.gradoId" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" :disabled="!!editingId">
              <option value="">Seleccione un grado...</option>
              <option v-for="g in grados" :key="g.id" :value="g.id">{{ g.nombre }}</option>
            </select>
            <p v-if="aulaErrors.gradoId" class="mt-1 text-xs text-red-500">{{ aulaErrors.gradoId }}</p>
          </div>
          <BaseInput v-model="aulaForm.nombre" label="Nombre de la sección" placeholder="Ej: A, B, C..." required :error="aulaErrors.nombre" />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Turno</label>
            <select v-model="aulaForm.turno" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="MAÑANA">Mañana</option>
              <option value="TARDE">Tarde</option>
              <option value="NOCHE">Noche</option>
            </select>
          </div>
          <BaseInput v-model.number="aulaForm.aforoMaximo" label="Aforo máximo" type="number" placeholder="Ej: 30 (opcional)" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <BaseButton variant="secondary" @click="closeAulaModal">Cancelar</BaseButton>
            <BaseButton :loading="isSavingAula" @click="saveSeccion">{{ editingId ? 'Guardar Cambios' : 'Crear Sección' }}</BaseButton>
          </div>
        </template>
      </BaseModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { CalendarIcon, ClockIcon, LayoutGridIcon, InfoIcon, PlusIcon, EditIcon, EyeIcon, EyeOffIcon } from 'lucide-vue-next';
import { schoolConfigService } from '../../api/services/school-config.service';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import BaseInput from '../../components/ui/BaseInput.vue';

const toast = useToast();

const activeTab = ref('general');
const tabs = [
  { id: 'general', label: 'General' },
  { id: 'aulas', label: 'Aulas' },
];

// --- General ---
const loading = ref(true);
const anioEscolar = ref<any>(null);
const periodos = ref<any[]>([]);
const regimen = ref<any[]>([]);

async function loadGeneral() {
  loading.value = true;
  try {
    const [anio, per, reg] = await Promise.all([
      schoolConfigService.getAnioEscolar(),
      schoolConfigService.getPeriodos(),
      schoolConfigService.getRegimen(),
    ]);
    anioEscolar.value = anio;
    periodos.value = per;
    regimen.value = reg;
  } catch {
    toast.error('Error al cargar configuración');
  } finally {
    loading.value = false;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
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

// --- Aulas ---
const aulasLoading = ref(false);
const secciones = ref<any[]>([]);
const grados = ref<any[]>([]);
const showAulaModal = ref(false);
const isSavingAula = ref(false);
const editingId = ref<string | null>(null);
const aulaErrors = ref<Record<string, string>>({});

const aulaForm = ref({ gradoId: '', nombre: '', turno: 'MAÑANA', aforoMaximo: undefined as number | undefined });

async function loadAulas() {
  aulasLoading.value = true;
  try {
    const [secs, grads] = await Promise.all([schoolConfigService.getAllSecciones(), schoolConfigService.getGrados()]);
    secciones.value = secs || [];
    grados.value = grads || [];
  } catch {
    toast.error('Error al cargar las secciones');
  } finally {
    aulasLoading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  aulaErrors.value = {};
  aulaForm.value = { gradoId: '', nombre: '', turno: 'MAÑANA', aforoMaximo: undefined };
  showAulaModal.value = true;
}

function openEdit(sec: any) {
  editingId.value = sec.id;
  aulaErrors.value = {};
  aulaForm.value = { gradoId: sec.grado_id, nombre: sec.nombre, turno: sec.turno || 'MAÑANA', aforoMaximo: sec.aforo_maximo || undefined };
  showAulaModal.value = true;
}

function closeAulaModal() { showAulaModal.value = false; }

async function saveSeccion() {
  aulaErrors.value = {};
  if (!editingId.value && !aulaForm.value.gradoId) { aulaErrors.value.gradoId = 'Seleccione un grado'; return; }
  if (!aulaForm.value.nombre.trim()) { aulaErrors.value.nombre = 'El nombre es obligatorio'; return; }

  isSavingAula.value = true;
  try {
    if (editingId.value) {
      await schoolConfigService.updateSeccion(editingId.value, { nombre: aulaForm.value.nombre, turno: aulaForm.value.turno, aforoMaximo: aulaForm.value.aforoMaximo || undefined });
      toast.success('Sección actualizada correctamente');
    } else {
      await schoolConfigService.createSeccion({ gradoId: aulaForm.value.gradoId, nombre: aulaForm.value.nombre, turno: aulaForm.value.turno, aforoMaximo: aulaForm.value.aforoMaximo || undefined });
      toast.success('Sección creada correctamente');
    }
    closeAulaModal();
    await loadAulas();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al guardar la sección');
  } finally {
    isSavingAula.value = false;
  }
}

async function toggleActiva(sec: any) {
  try {
    await schoolConfigService.updateSeccion(sec.id, { activa: !sec.activa });
    toast.success(sec.activa ? 'Sección desactivada' : 'Sección activada');
    await loadAulas();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al cambiar estado');
  }
}

onMounted(async () => {
  await Promise.all([loadGeneral(), loadAulas()]);
});
</script>
