<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Estudiantes</h1>
        <p class="text-gray-500 mt-1">Gestione la base de datos de estudiantes registrados en la institución.</p>
      </div>
      <BaseButton @click="router.push('/estudiantes/nuevo')">
        <PlusIcon class="w-4 h-4" />
        Nuevo Estudiante
      </BaseButton>
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div class="relative">
        <SearchIcon class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre o DNI..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @input="handleSearch"
        />
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <BaseTable
        :columns="headers"
        :data="estudiantesData"
        :loading="isLoading"
      >
        <template #cell-nombre="{ row }">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              {{ row.nombres[0] }}{{ row.apellido_paterno[0] }}
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ row.apellido_paterno }} {{ row.apellido_materno }}, {{ row.nombres }}</p>
              <p class="text-xs text-gray-500">{{ row.dni }}</p>
            </div>
          </div>
        </template>

        <template #cell-genero="{ row }">
          <BaseBadge :variant="row.genero === 'M' ? 'info' : 'neutral'">
            {{ row.genero === 'M' ? 'Masculino' : 'Femenino' }}
          </BaseBadge>
        </template>

        <template #cell-acciones="{ row }">
          <div class="flex items-center gap-2">
            <button @click="router.push(`/estudiantes/${row.id}`)" class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalle">
              <EyeIcon class="w-4 h-4" />
            </button>
            <button @click="router.push(`/estudiantes/${row.id}/editar`)" class="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
              <EditIcon class="w-4 h-4" />
            </button>
            <button @click="confirmDelete(row)" class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </template>
      </BaseTable>

      <div class="px-6 py-4 border-t border-gray-100">
        <BasePagination
          :currentPage="page"
          :totalPages="totalPages"
          :total="totalItems"
          @page-change="page = $event"
        />
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <BaseModal
      :show="showDeleteModal"
      title="Eliminar Estudiante"
      @close="showDeleteModal = false"
    >
      <div class="space-y-3">
        <p class="text-sm text-gray-600">
          ¿Está seguro de que desea eliminar al estudiante <span class="font-semibold">{{ selectedItem?.nombres }} {{ selectedItem?.apellido_paterno }}</span>?
        </p>
        <p class="text-xs text-red-500 bg-red-50 p-2 rounded">
          Esta acción no se puede deshacer y ocultará al estudiante de todas las listas.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showDeleteModal = false">Cancelar</BaseButton>
          <BaseButton variant="danger" :loading="isDeleting" @click="handleDelete">Eliminar</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { PlusIcon, SearchIcon, EyeIcon, EditIcon, TrashIcon } from 'lucide-vue-next';
import { estudiantesService } from '../../api/services/estudiantes.service';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseTable from '../../components/ui/BaseTable.vue';
import BasePagination from '../../components/ui/BasePagination.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import { debounce } from 'lodash';

const toast = useToast();

const router = useRouter();
const queryClient = useQueryClient();

const page = ref(1);
const limit = ref(20);
const search = ref('');

const headers = [
  { key: 'nombre', label: 'Estudiante' },
  { key: 'dni', label: 'DNI', class: 'hidden md:table-cell' },
  { key: 'genero', label: 'Género', class: 'hidden sm:table-cell' },
  { key: 'fecha_nacimiento', label: 'F. Nacimiento', class: 'hidden lg:table-cell' },
  { key: 'acciones', label: 'Acciones', class: 'text-right' },
];

const { data: queryResult, isLoading } = useQuery({
  queryKey: ['estudiantes', page, search],
  queryFn: () => estudiantesService.getEstudiantes(page.value, limit.value, search.value),
});

const estudiantesData = computed(() => {
  const res = queryResult.value;
  if (!res) return [];
  // Manejar ambos casos: si viene como res.data o si el objeto res ya es la data (dependiendo del interceptor)
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
});

const totalItems = computed(() => queryResult.value?.meta?.total || 0);
const totalPages = computed(() => queryResult.value?.meta?.totalPages || 1);

const handleSearch = debounce(() => {
  page.value = 1;
}, 500);

// Lógica de eliminación
const showDeleteModal = ref(false);
const selectedItem = ref<any>(null);
const isDeleting = ref(false);

function confirmDelete(item: any) {
  selectedItem.value = item;
  showDeleteModal.value = true;
}

const deleteMutation = useMutation({
  mutationFn: (id: string) => estudiantesService.deleteEstudiante(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['estudiantes'] });
    showDeleteModal.value = false;
    selectedItem.value = null;
    toast.success('Estudiante eliminado correctamente');
  },
  onError: () => {
    toast.error('Error al eliminar el estudiante');
  },
});

async function handleDelete() {
  if (!selectedItem.value) return;
  isDeleting.value = true;
  try {
    await deleteMutation.mutateAsync(selectedItem.value.id);
  } finally {
    isDeleting.value = false;
  }
}
</script>
