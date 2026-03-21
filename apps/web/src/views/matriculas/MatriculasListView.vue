<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Matrículas {{ anioEscolar?.anio }}</h1>
        <p class="text-gray-500 mt-1">Gestión de inscripciones y estados de los estudiantes para el presente año.</p>
      </div>
      <BaseButton @click="router.push('/matriculas/nueva')">
        <UserPlusIcon class="w-4 h-4" />
        Nueva Matrícula
      </BaseButton>
    </div>

    <!-- Filtros -->
    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
      <div class="flex-1">
        <BaseSelect v-model="filterSeccion" :options="seccionesOptions" placeholder="Todas las secciones" label="Sección" />
      </div>
      <div class="flex-1">
        <BaseSelect v-model="filterEstado" :options="estadosOptions" placeholder="Todos los estados" label="Estado" />
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <BaseTable
        :columns="headers"
        :data="data?.data || []"
        :loading="isLoading"
      >
        <template #cell-estudiante="{ row }">
          <div class="flex flex-col">
            <span class="font-medium text-gray-900">{{ row.apellido_paterno }} {{ row.apellido_materno }}, {{ row.nombres }}</span>
            <span class="text-xs text-gray-500">{{ row.dni }}</span>
          </div>
        </template>

        <template #cell-grado_seccion="{ row }">
          <span>{{ row.grado_nombre }} - {{ row.seccion_nombre }}</span>
        </template>

        <template #cell-estado="{ row }">
          <BaseBadge :variant="estadoVariant(row.estado)">
            {{ row.estado }}
          </BaseBadge>
        </template>

        <template #cell-acciones="{ row }">
          <div class="flex items-center gap-2">
            <button @click="router.push(`/matriculas/${row.id}`)" class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Detalle">
              <EyeIcon class="w-4 h-4" />
            </button>
            <button v-if="row.estado === 'ACTIVA'" @click="confirmRetiro(row)" class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Retirar Estudiante">
              <UserMinusIcon class="w-4 h-4" />
            </button>
          </div>
        </template>
      </BaseTable>

      <div class="px-6 py-4 border-t border-gray-100">
        <BasePagination
          :currentPage="page"
          :totalPages="data?.meta?.totalPages || 1"
          :total="data?.meta?.total || 0"
          @page-change="page = $event"
        />
      </div>
    </div>

    <!-- Modal Retiro -->
    <BaseModal :show="showRetiroModal" title="Registrar Retiro de Estudiante" @close="showRetiroModal = false">
      <div class="space-y-4">
        <p class="text-sm text-gray-600 font-medium">Estudiante: {{ selectedMatricula?.nombres }} {{ selectedMatricula?.apellido_paterno }}</p>
        <BaseInput v-model="retiroForm.fechaRetiro" type="date" label="Fecha de Retiro" required />
        <BaseInput v-model="retiroForm.motivo" label="Motivo del retiro" placeholder="Ej: Traslado, Motivos personales..." required />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showRetiroModal = false">Cancelar</BaseButton>
          <BaseButton variant="danger" :loading="isRetiring" @click="handleRetiro">Confirmar Retiro</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { 
  UserPlusIcon, 
  UserMinusIcon,
  EyeIcon,
  SearchIcon
} from 'lucide-vue-next';
import { matriculasService } from '../../api/services/matriculas.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseTable from '../../components/ui/BaseTable.vue';
import BasePagination from '../../components/ui/BasePagination.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseModal from '../../components/ui/BaseModal.vue';

const router = useRouter();
const queryClient = useQueryClient();

const page = ref(1);
const limit = ref(20);
const filterSeccion = ref('');
const filterEstado = ref('');
const anioEscolar = ref<any>(null);

const headers = [
  { key: 'estudiante', label: 'Estudiante' },
  { key: 'grado_seccion', label: 'Grado y Sección' },
  { key: 'tipo_matricula', label: 'Tipo' },
  { key: 'fecha_matricula', label: 'F. Matrícula' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', class: 'text-right' },
];

const estadosOptions = [
  { label: 'Todos', value: '' },
  { label: 'Activa', value: 'ACTIVA' },
  { label: 'Retirada', value: 'RETIRADA' },
  { label: 'Trasladada', value: 'TRASLADADA' },
];

const seccionesOptions = ref([{ label: 'Cargando...', value: '' }]);

onMounted(async () => {
  const [anio, secc] = await Promise.all([
    schoolConfigService.getAnioEscolar(),
    schoolConfigService.getSecciones(),
  ]);
  anioEscolar.value = anio;
  seccionesOptions.value = [
    { label: 'Todas las secciones', value: '' },
    ...secc.map((s: any) => ({
      label: `${s.grado_nombre} - ${s.nombre}`,
      value: s.id
    }))
  ];
});

const { data, isLoading } = useQuery({
  queryKey: ['matriculas', page, filterSeccion, filterEstado, anioEscolar],
  queryFn: () => {
    if (!anioEscolar.value) return { data: [], meta: { total: 0 } };
    return matriculasService.getMatriculas(anioEscolar.value.id, page.value, limit.value, {
      seccionId: filterSeccion.value,
      estado: filterEstado.value
    });
  },
  enabled: () => !!anioEscolar.value,
});

function estadoVariant(estado: string) {
  if (estado === 'ACTIVA') return 'success';
  if (estado === 'RETIRADA') return 'danger';
  return 'neutral';
}

// Lógica de Retiro
const showRetiroModal = ref(false);
const selectedMatricula = ref<any>(null);
const isRetiring = ref(false);
const retiroForm = ref({ fechaRetiro: new Date().toISOString().split('T')[0], motivo: '' });

function confirmRetiro(item: any) {
  selectedMatricula.value = item;
  showRetiroModal.value = true;
}

async function handleRetiro() {
  if (!selectedMatricula.value || !retiroForm.value.motivo) return;
  isRetiring.value = true;
  try {
    await matriculasService.retirar(selectedMatricula.value.id, retiroForm.value);
    queryClient.invalidateQueries({ queryKey: ['matriculas'] });
    showRetiroModal.value = false;
  } finally {
    isRetiring.value = false;
  }
}
</script>
