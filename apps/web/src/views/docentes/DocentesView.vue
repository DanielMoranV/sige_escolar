<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestión de Docentes</h1>
        <p class="text-gray-500 mt-1">Administre el personal docente y sus asignaciones de área.</p>
      </div>
      <BaseButton @click="openCreate">
        <PlusIcon class="w-4 h-4" />
        Nuevo Docente
      </BaseButton>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
      </div>

      <table v-else class="w-full text-sm text-left">
        <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
          <tr>
            <th class="px-6 py-3">Docente</th>
            <th class="px-6 py-3">DNI</th>
            <th class="px-6 py-3 hidden lg:table-cell">Especialidad</th>
            <th class="px-6 py-3 hidden md:table-cell">Email</th>
            <th class="px-6 py-3 text-center">Asignaciones</th>
            <th class="px-6 py-3 text-center">Estado</th>
            <th class="px-6 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="!docentes.length">
            <td colspan="7" class="px-6 py-10 text-center text-gray-500">
              No hay docentes registrados.
            </td>
          </tr>
          <tr v-for="doc in docentes" :key="doc.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {{ doc.nombres?.[0] }}{{ doc.apellidos?.[0] }}
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ doc.apellidos }}, {{ doc.nombres }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-gray-600 font-mono">{{ doc.dni }}</td>
            <td class="px-6 py-4 hidden lg:table-cell text-gray-600">{{ doc.especialidad || '—' }}</td>
            <td class="px-6 py-4 hidden md:table-cell text-gray-600">{{ doc.email || '—' }}</td>
            <td class="px-6 py-4 text-center">
              <button
                @click="openAsignaciones(doc)"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                :title="`Ver ${doc.total_asignaciones} asignaciones`"
              >
                <LayoutGridIcon class="w-3.5 h-3.5" />
                {{ doc.total_asignaciones }}
              </button>
            </td>
            <td class="px-6 py-4 text-center">
              <BaseBadge :variant="doc.activo ? 'success' : 'neutral'">
                {{ doc.activo ? 'Activo' : 'Inactivo' }}
              </BaseBadge>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  @click="openEdit(doc)"
                  class="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <EditIcon class="w-4 h-4" />
                </button>
                <button
                  @click="toggleActivo(doc)"
                  class="p-1.5 rounded-lg transition-colors"
                  :class="doc.activo
                    ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50'"
                  :title="doc.activo ? 'Desactivar' : 'Activar'"
                >
                  <EyeOffIcon v-if="doc.activo" class="w-4 h-4" />
                  <EyeIcon v-else class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal 1: Create / Edit Docente -->
    <BaseModal
      :show="showFormModal"
      :title="editingId ? 'Editar Docente' : 'Nuevo Docente'"
      @close="closeFormModal"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput
            v-model="form.nombres"
            label="Nombres"
            placeholder="Ej: Juan Carlos"
            required
            :error="formErrors.nombres"
          />
          <BaseInput
            v-model="form.apellidos"
            label="Apellidos"
            placeholder="Ej: García López"
            required
            :error="formErrors.apellidos"
          />
        </div>

        <BaseInput
          v-model="form.dni"
          label="DNI"
          placeholder="8 dígitos"
          required
          :disabled="!!editingId"
          :error="formErrors.dni"
        />

        <BaseInput
          v-model="form.especialidad"
          label="Especialidad"
          placeholder="Ej: Matemática, Comunicación..."
        />

        <BaseInput
          v-if="!editingId"
          v-model="form.email"
          label="Correo electrónico"
          type="email"
          placeholder="docente@escuela.edu.pe"
          required
          :error="formErrors.email"
        />

        <div v-if="!editingId" class="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <InfoIcon class="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p class="text-xs text-blue-700">
            Se creará una cuenta de acceso para el docente. Una contraseña temporal será generada y mostrada al confirmar.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="closeFormModal">Cancelar</BaseButton>
          <BaseButton :loading="isSaving" @click="saveDocente">
            {{ editingId ? 'Guardar Cambios' : 'Crear Docente' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Modal 2: Assignments Manager -->
    <BaseModal
      :show="showAsignModal"
      :title="`Asignaciones — ${selectedDocente?.apellidos}, ${selectedDocente?.nombres}`"
      @close="showAsignModal = false"
    >
      <div class="space-y-5">
        <!-- Current assignments list -->
        <div>
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Asignaciones actuales</h3>
          <div v-if="isLoadingAsign" class="py-4 text-center">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <div v-else-if="!asignaciones.length" class="py-4 text-center text-sm text-gray-500">
            Este docente no tiene asignaciones aún.
          </div>
          <ul v-else class="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
            <li
              v-for="asign in asignaciones"
              :key="asign.id"
              class="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm text-gray-900 font-medium">{{ asign.grado_nombre }} {{ asign.seccion_nombre }}</span>
                <span class="text-gray-400">·</span>
                <span class="text-sm text-gray-600">{{ asign.area_nombre }}</span>
                <BaseBadge v-if="asign.es_tutor" variant="info" class="text-xs">TUTOR</BaseBadge>
              </div>
              <button
                @click="deleteAsignacion(asign.id)"
                class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Eliminar asignación"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </li>
          </ul>
        </div>

        <!-- Add new assignment form -->
        <div class="border-t border-gray-100 pt-4 space-y-3">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Agregar asignación</h3>

          <BaseSelect
            v-model="newAsign.seccionId"
            label="Sección"
            :options="seccionesOptions"
            :error="asignErrors.seccionId"
          />

          <BaseSelect
            v-model="newAsign.areaIeId"
            label="Área"
            :options="areasOptions"
            :disabled="!newAsign.seccionId"
            :error="asignErrors.areaIeId"
          />

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="newAsign.esTutor"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">Es tutor de la sección</span>
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showAsignModal = false">Cerrar</BaseButton>
          <BaseButton :loading="isAddingAsign" @click="addAsignacion">
            Agregar Asignación
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Modal 3: Temp password reveal after create -->
    <BaseModal
      :show="showCredentialModal"
      title="Docente creado exitosamente"
      @close="showCredentialModal = false"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          La cuenta del docente ha sido creada. Comparta estas credenciales con el docente de forma segura.
        </p>
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 font-medium">Correo electrónico</span>
            <code class="text-sm font-mono text-gray-900">{{ createdCredentials.email }}</code>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 font-medium">Contraseña temporal</span>
            <code class="text-sm font-mono bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold tracking-widest">
              {{ createdCredentials.tempPassword }}
            </code>
          </div>
        </div>
        <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          El docente deberá cambiar su contraseña en el primer inicio de sesión. Esta contraseña no volverá a mostrarse.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <BaseButton @click="showCredentialModal = false">Entendido</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { PlusIcon, EditIcon, EyeIcon, EyeOffIcon, TrashIcon, LayoutGridIcon, InfoIcon } from 'lucide-vue-next';
import { docentesService } from '../../api/services/docentes.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';

const toast = useToast();

// ── Data ──────────────────────────────────────────────────────────────────────
const isLoading = ref(false);
const docentes = ref<any[]>([]);
const rawSecciones = ref<any[]>([]);
const rawAreas = ref<any[]>([]);

// ── Form modal ────────────────────────────────────────────────────────────────
const showFormModal = ref(false);
const isSaving = ref(false);
const editingId = ref<string | null>(null);
const formErrors = ref<Record<string, string>>({});

const form = ref({
  nombres: '',
  apellidos: '',
  dni: '',
  especialidad: '',
  email: '',
});

// ── Assignments modal ─────────────────────────────────────────────────────────
const showAsignModal = ref(false);
const selectedDocente = ref<any>(null);
const isLoadingAsign = ref(false);
const isAddingAsign = ref(false);
const asignaciones = ref<any[]>([]);
const asignErrors = ref<Record<string, string>>({});

const newAsign = ref({
  seccionId: '',
  areaIeId: '',
  esTutor: false,
});

// ── Credentials reveal modal ──────────────────────────────────────────────────
const showCredentialModal = ref(false);
const createdCredentials = ref({ email: '', tempPassword: '' });

// ── Computed options ──────────────────────────────────────────────────────────
const seccionesOptions = computed(() =>
  rawSecciones.value.map(s => ({
    label: `${s.grado_nombre} - ${s.nombre}`,
    value: s.id,
  }))
);

const areasOptions = computed(() => {
  const seccion = rawSecciones.value.find(s => s.id === newAsign.value.seccionId);
  const areas = seccion
    ? rawAreas.value.filter(a => a.nivel === seccion.nivel)
    : rawAreas.value;
  return areas.map(a => ({ label: a.nombre_display, value: a.id }));
});

// Reset areaIeId when seccion changes
watch(() => newAsign.value.seccionId, () => {
  newAsign.value.areaIeId = '';
});

// ── Load data ─────────────────────────────────────────────────────────────────
async function load() {
  isLoading.value = true;
  try {
    docentes.value = await docentesService.getAll() || [];
  } catch {
    toast.error('Error al cargar los docentes');
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await load();
  try {
    const [secs, areas] = await Promise.all([
      schoolConfigService.getAllSecciones(),
      schoolConfigService.getAllAreas(),
    ]);
    rawSecciones.value = secs || [];
    rawAreas.value = areas || [];
  } catch {
    toast.error('Error al cargar la configuración escolar');
  }
});

// ── Form modal handlers ───────────────────────────────────────────────────────
function openCreate() {
  editingId.value = null;
  formErrors.value = {};
  form.value = { nombres: '', apellidos: '', dni: '', especialidad: '', email: '' };
  showFormModal.value = true;
}

function openEdit(doc: any) {
  editingId.value = doc.id;
  formErrors.value = {};
  form.value = {
    nombres: doc.nombres,
    apellidos: doc.apellidos,
    dni: doc.dni,
    especialidad: doc.especialidad || '',
    email: doc.email || '',
  };
  showFormModal.value = true;
}

function closeFormModal() {
  showFormModal.value = false;
}

async function saveDocente() {
  formErrors.value = {};

  if (!form.value.nombres.trim()) { formErrors.value.nombres = 'El nombre es obligatorio'; return; }
  if (!form.value.apellidos.trim()) { formErrors.value.apellidos = 'Los apellidos son obligatorios'; return; }
  if (!editingId.value) {
    if (!form.value.dni.trim() || form.value.dni.length !== 8) { formErrors.value.dni = 'DNI debe tener 8 dígitos'; return; }
    if (!form.value.email.trim()) { formErrors.value.email = 'El correo es obligatorio'; return; }
  }

  isSaving.value = true;
  try {
    if (editingId.value) {
      await docentesService.update(editingId.value, {
        nombres: form.value.nombres,
        apellidos: form.value.apellidos,
        especialidad: form.value.especialidad || undefined,
      });
      toast.success('Docente actualizado correctamente');
      closeFormModal();
    } else {
      const result = await docentesService.create({
        nombres: form.value.nombres,
        apellidos: form.value.apellidos,
        dni: form.value.dni,
        email: form.value.email,
        especialidad: form.value.especialidad || undefined,
      });
      closeFormModal();
      createdCredentials.value = { email: result.email, tempPassword: result.tempPassword };
      showCredentialModal.value = true;
    }
    await load();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al guardar el docente');
  } finally {
    isSaving.value = false;
  }
}

async function toggleActivo(doc: any) {
  try {
    await docentesService.update(doc.id, { activo: !doc.activo });
    toast.success(doc.activo ? 'Docente desactivado' : 'Docente activado');
    await load();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al cambiar el estado');
  }
}

// ── Assignments modal handlers ────────────────────────────────────────────────
async function openAsignaciones(doc: any) {
  selectedDocente.value = doc;
  newAsign.value = { seccionId: '', areaIeId: '', esTutor: false };
  asignErrors.value = {};
  showAsignModal.value = true;
  await refreshAsignaciones();
}

async function refreshAsignaciones() {
  if (!selectedDocente.value) return;
  isLoadingAsign.value = true;
  try {
    asignaciones.value = await docentesService.getAsignaciones(selectedDocente.value.id) || [];
  } catch {
    toast.error('Error al cargar las asignaciones');
  } finally {
    isLoadingAsign.value = false;
  }
}

async function addAsignacion() {
  asignErrors.value = {};
  if (!newAsign.value.seccionId) { asignErrors.value.seccionId = 'Seleccione una sección'; return; }
  if (!newAsign.value.areaIeId) { asignErrors.value.areaIeId = 'Seleccione un área'; return; }

  isAddingAsign.value = true;
  try {
    await docentesService.asignar({
      docenteId: selectedDocente.value.id,
      seccionId: newAsign.value.seccionId,
      areaIeId: newAsign.value.areaIeId,
      esTutor: newAsign.value.esTutor,
    });
    toast.success('Asignación agregada correctamente');
    newAsign.value = { seccionId: '', areaIeId: '', esTutor: false };
    await refreshAsignaciones();
    await load();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al agregar la asignación');
  } finally {
    isAddingAsign.value = false;
  }
}

async function deleteAsignacion(id: string) {
  try {
    await docentesService.removeAsignacion(id);
    toast.success('Asignación eliminada');
    await refreshAsignaciones();
    await load();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al eliminar la asignación');
  }
}
</script>
