<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestión de Aulas</h1>
        <p class="text-gray-500 mt-1">Administre las secciones del año escolar activo.</p>
      </div>
      <BaseButton @click="openCreate">
        <PlusIcon class="w-4 h-4" />
        Nueva Sección
      </BaseButton>
    </div>

    <!-- Tabla de secciones -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center">
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
          <tr v-if="!seccionesFiltradas.length">
            <td colspan="8" class="px-6 py-10 text-center text-gray-500">
              No hay secciones registradas para el año escolar activo.
            </td>
          </tr>
          <tr v-for="sec in seccionesFiltradas" :key="sec.id" class="hover:bg-gray-50 transition-colors">
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
              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="sec.nivel === 'PRIMARIA' ? 'bg-blue-100 text-blue-700' : sec.nivel === 'INICIAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'">
                {{ sec.nivel }}
              </span>
            </td>
            <td class="px-6 py-4 hidden md:table-cell text-gray-600">{{ sec.turno }}</td>
            <td class="px-6 py-4 hidden lg:table-cell text-gray-600">{{ sec.tutor_nombre || '—' }}</td>
            <td class="px-6 py-4 hidden md:table-cell text-center font-medium text-gray-900">{{ sec.total_matriculados ?? 0 }}</td>
            <td class="px-6 py-4 hidden md:table-cell text-center text-gray-600">{{ sec.aforo_maximo || '—' }}</td>
            <td class="px-6 py-4 text-center">
              <BaseBadge :variant="sec.activa ? 'success' : 'neutral'">
                {{ sec.activa ? 'Activa' : 'Inactiva' }}
              </BaseBadge>
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

    <!-- Modal Crear / Editar -->
    <BaseModal :show="showModal" :title="editingId ? 'Editar Sección' : 'Nueva Sección'" @close="closeModal">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Grado <span class="text-red-500">*</span></label>
          <select v-model="form.gradoId" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" :disabled="!!editingId">
            <option value="">Seleccione un grado...</option>
            <option v-for="g in grados" :key="g.id" :value="g.id">{{ g.nombre }}</option>
          </select>
          <p v-if="errors.gradoId" class="mt-1 text-xs text-red-500">{{ errors.gradoId }}</p>
        </div>

        <BaseInput v-model="form.nombre" label="Nombre de la sección" placeholder="Ej: A, B, C..." required :error="errors.nombre" />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Turno</label>
          <select v-model="form.turno" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="MAÑANA">Mañana</option>
            <option value="TARDE">Tarde</option>
            <option value="NOCHE">Noche</option>
          </select>
        </div>

        <BaseInput v-model.number="form.aforoMaximo" label="Aforo máximo" type="number" placeholder="Ej: 30 (opcional)" />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="closeModal">Cancelar</BaseButton>
          <BaseButton :loading="isSaving" @click="saveSeccion">
            {{ editingId ? 'Guardar Cambios' : 'Crear Sección' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PlusIcon, EditIcon, EyeIcon, EyeOffIcon } from 'lucide-vue-next';
import { schoolConfigService } from '../../api/services/school-config.service';
import { useNivelStore } from '../../stores/nivel.store';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import BaseInput from '../../components/ui/BaseInput.vue';

const toast = useToast();
const nivelStore = useNivelStore();

const isLoading = ref(true);
const secciones = ref<any[]>([]);
const seccionesFiltradas = computed(() =>
  nivelStore.nivelActivo === 'TODOS'
    ? secciones.value
    : secciones.value.filter(s => s.nivel === nivelStore.nivelActivo)
);
const grados = ref<any[]>([]);
const showModal = ref(false);
const isSaving = ref(false);
const editingId = ref<string | null>(null);
const errors = ref<Record<string, string>>({});

const form = ref({
  gradoId: '',
  nombre: '',
  turno: 'MAÑANA',
  aforoMaximo: undefined as number | undefined,
});

async function load() {
  isLoading.value = true;
  try {
    const [secs, grads] = await Promise.all([
      schoolConfigService.getAllSecciones(),
      schoolConfigService.getGrados(),
    ]);
    secciones.value = secs || [];
    grados.value = grads || [];
  } catch {
    toast.error('Error al cargar las secciones');
  } finally {
    isLoading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  errors.value = {};
  form.value = { gradoId: '', nombre: '', turno: 'MAÑANA', aforoMaximo: undefined };
  showModal.value = true;
}

function openEdit(sec: any) {
  editingId.value = sec.id;
  errors.value = {};
  form.value = {
    gradoId: sec.grado_id,
    nombre: sec.nombre,
    turno: sec.turno || 'MAÑANA',
    aforoMaximo: sec.aforo_maximo || undefined,
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function saveSeccion() {
  errors.value = {};
  if (!editingId.value && !form.value.gradoId) {
    errors.value.gradoId = 'Seleccione un grado';
    return;
  }
  if (!form.value.nombre.trim()) {
    errors.value.nombre = 'El nombre es obligatorio';
    return;
  }

  isSaving.value = true;
  try {
    if (editingId.value) {
      await schoolConfigService.updateSeccion(editingId.value, {
        nombre: form.value.nombre,
        turno: form.value.turno,
        aforoMaximo: form.value.aforoMaximo || undefined,
      });
      toast.success('Sección actualizada correctamente');
    } else {
      await schoolConfigService.createSeccion({
        gradoId: form.value.gradoId,
        nombre: form.value.nombre,
        turno: form.value.turno,
        aforoMaximo: form.value.aforoMaximo || undefined,
      });
      toast.success('Sección creada correctamente');
    }
    closeModal();
    await load();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al guardar la sección');
  } finally {
    isSaving.value = false;
  }
}

async function toggleActiva(sec: any) {
  try {
    await schoolConfigService.updateSeccion(sec.id, { activa: !sec.activa });
    toast.success(sec.activa ? 'Sección desactivada' : 'Sección activada');
    await load();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al cambiar estado');
  }
}

onMounted(load);
</script>
