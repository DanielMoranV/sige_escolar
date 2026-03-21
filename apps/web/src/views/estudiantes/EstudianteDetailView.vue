<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button @click="router.back()" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Detalle del Estudiante</h1>
        </div>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="secondary" @click="router.push(`/estudiantes/${estudianteId}/editar`)">
          <EditIcon class="w-4 h-4" /> Editar
        </BaseButton>
        <BaseButton variant="danger" @click="showDeleteModal = true">
          <TrashIcon class="w-4 h-4" /> Eliminar
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-500">Cargando datos del estudiante...</p>
    </div>

    <div v-else-if="estudiante" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Datos Personales -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
          <div class="w-24 h-24 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl mb-4">
            {{ estudiante.nombres[0] }}{{ estudiante.apellido_paterno[0] }}
          </div>
          <h2 class="text-xl font-bold text-gray-900">{{ estudiante.nombres }}</h2>
          <p class="text-gray-600">{{ estudiante.apellido_paterno }} {{ estudiante.apellido_materno }}</p>
          <div class="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            DNI: {{ estudiante.dni }}
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 class="font-semibold text-gray-900 border-b pb-2">Información Complementaria</h3>
          <div class="text-sm space-y-2">
            <p><span class="text-gray-500 w-32 inline-block">F. Nacimiento:</span> {{ estudiante.fecha_nacimiento }}</p>
            <p><span class="text-gray-500 w-32 inline-block">Género:</span> {{ estudiante.genero === 'M' ? 'Masculino' : 'Femenino' }}</p>
            <p><span class="text-gray-500 w-32 inline-block">Cód. SIAGIE:</span> {{ estudiante.codigo_siagie || '—' }}</p>
            <p><span class="text-gray-500 w-32 inline-block">Lengua:</span> {{ estudiante.lengua_materna }}</p>
          </div>
        </div>
      </div>

      <!-- Apoderados y Matrículas -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Apoderados -->
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Apoderados</h3>
            <BaseButton size="sm" variant="secondary" @click="showApoderadoForm = !showApoderadoForm">
              <PlusIcon class="w-4 h-4" /> Añadir
            </BaseButton>
          </div>

          <div v-if="showApoderadoForm" class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <ComponenteApoderado v-model="nuevoApoderado" />
            <div class="mt-4 flex justify-end gap-2">
              <BaseButton variant="secondary" size="sm" @click="showApoderadoForm = false">Cancelar</BaseButton>
              <BaseButton size="sm" @click="saveApoderado" :loading="isSavingApoderado">Guardar Apoderado</BaseButton>
            </div>
          </div>

          <div v-if="!apoderados.length && !showApoderadoForm" class="text-center py-6 text-gray-500 text-sm">
            No hay apoderados registrados.
          </div>
          <div v-else class="space-y-3">
            <div v-for="apo in apoderados" :key="apo.id" class="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">{{ apo.nombres }} {{ apo.apellido_paterno }}</p>
                <p class="text-xs text-gray-500">{{ apo.parentesco }} • DNI: {{ apo.dni }}</p>
              </div>
              <BaseBadge v-if="apo.es_apoderado_principal" variant="info">Principal</BaseBadge>
            </div>
          </div>
        </div>

        <!-- Matrículas y Exoneraciones -->
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b pb-2">
            <h3 class="font-semibold text-gray-900">Historial de Matrículas</h3>
            <BaseButton size="sm" @click="router.push('/matriculas/nueva')">Nueva Matrícula</BaseButton>
          </div>

          <div v-if="!matriculas.length" class="text-center py-6 text-gray-500 text-sm">
            No registra matrículas en el sistema.
          </div>
          
          <div v-for="mat in matriculas" :key="mat.id" class="p-4 border border-gray-200 rounded-xl space-y-4">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-bold text-gray-900">{{ mat.grado_nombre }} - {{ mat.seccion_nombre }}</p>
                <p class="text-sm text-gray-500">{{ mat.tipo_matricula }} • F. Matrícula: {{ mat.fecha_matricula }}</p>
              </div>
              <BaseBadge :variant="mat.estado === 'ACTIVA' ? 'success' : 'neutral'">{{ mat.estado }}</BaseBadge>
            </div>
            
            <div class="pt-3 border-t border-gray-100">
              <ComponenteExoneracion v-if="mat.estado === 'ACTIVA'" :matriculaId="mat.id" />
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Modal confirmación eliminar -->
  <BaseModal :show="showDeleteModal" title="Eliminar Estudiante" @close="showDeleteModal = false">
    <div class="space-y-3">
      <p class="text-sm text-gray-600">
        ¿Está seguro de que desea eliminar a
        <span class="font-semibold">{{ estudiante?.nombres }} {{ estudiante?.apellido_paterno }}</span>?
      </p>
      <p class="text-xs text-red-500 bg-red-50 p-2 rounded">
        Esta acción ocultará al estudiante de todas las listas.
      </p>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="secondary" @click="showDeleteModal = false">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeleting" @click="handleDelete">Eliminar</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { ArrowLeftIcon, EditIcon, TrashIcon, PlusIcon } from 'lucide-vue-next';
import apiClient from '../../api/client';
import { estudiantesService } from '../../api/services/estudiantes.service';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import ComponenteApoderado from '../../components/ui/ComponenteApoderado.vue';
import ComponenteExoneracion from '../../components/ui/ComponenteExoneracion.vue';

const toast = useToast();

const route = useRoute();
const router = useRouter();
const estudianteId = route.params.id as string;

const showApoderadoForm = ref(false);
const isSavingApoderado = ref(false);
const nuevoApoderado = ref<any>({});
const apoderados = ref<any[]>([]);
const matriculas = ref<any[]>([]);
const showDeleteModal = ref(false);
const isDeleting = ref(false);

const { data: estudiante, isLoading, refetch } = useQuery({
  queryKey: ['estudiante-detalle', estudianteId],
  queryFn: async () => {
    const data = await estudiantesService.getEstudiante(estudianteId);
    await loadRelations();
    return data;
  }
});

async function loadRelations() {
  try {
    const [resMat, resApo] = await Promise.all([
      apiClient.get(`/matriculas?estudianteId=${estudianteId}&limit=10`),
      apiClient.get(`/estudiantes/${estudianteId}/apoderados`).catch(() => ({ data: { data: [] } })),
    ]);
    matriculas.value = resMat.data.data || [];
    apoderados.value = resApo.data.data || [];
  } catch {
    toast.error('Error al cargar datos del estudiante');
  }
}

async function saveApoderado() {
  isSavingApoderado.value = true;
  try {
    await apiClient.post('/apoderados', { ...nuevoApoderado.value, estudianteId });
    showApoderadoForm.value = false;
    nuevoApoderado.value = {};
    toast.success('Apoderado guardado correctamente');
    loadRelations();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al guardar apoderado');
  } finally {
    isSavingApoderado.value = false;
  }
}

async function handleDelete() {
  isDeleting.value = true;
  try {
    await estudiantesService.deleteEstudiante(estudianteId);
    router.push('/estudiantes');
  } catch {
    toast.error('Error al eliminar el estudiante');
    showDeleteModal.value = false;
  } finally {
    isDeleting.value = false;
  }
}
</script>
