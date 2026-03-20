<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Colegios</h1>
        <p class="text-gray-500 mt-1">Gestión de instituciones educativas en el sistema.</p>
      </div>
      <RouterLink to="/tenants/crear">
        <BaseButton>
          <PlusIcon class="w-4 h-4" />
          Nuevo colegio
        </BaseButton>
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[200px]">
        <BaseInput
          v-model="search"
          placeholder="Buscar por nombre o slug..."
          label="Buscar"
        />
      </div>
      <div class="w-48">
        <BaseSelect
          v-model="filterPlan"
          label="Plan"
          :options="[
            { value: '', label: 'Todos los planes' },
            { value: 'basico', label: 'Básico' },
            { value: 'profesional', label: 'Profesional' },
            { value: 'enterprise', label: 'Enterprise' },
          ]"
        />
      </div>
      <div class="w-40">
        <BaseSelect
          v-model="filterActivo"
          label="Estado"
          :options="[
            { value: '', label: 'Todos' },
            { value: 'true', label: 'Activos' },
            { value: 'false', label: 'Inactivos' },
          ]"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200">
      <BaseTable
        :columns="columns"
        :data="tenants"
        :loading="isFetching"
      >
        <template #cell-nombre="{ row }">
          <div>
            <p class="font-medium text-gray-900">{{ row.nombre }}</p>
            <p class="text-xs text-gray-400">{{ row.slug }}</p>
          </div>
        </template>

        <template #cell-codigoModular="{ row }">
          <span class="font-mono text-sm">{{ row.datos_minedu?.codigo_modular ?? '—' }}</span>
        </template>

        <template #cell-plan="{ row }">
          <BaseBadge :variant="planVariant(row.plan)">{{ planLabel(row.plan) }}</BaseBadge>
        </template>

        <template #cell-estado="{ row }">
          <BaseBadge :variant="row.activo ? 'success' : 'danger'">
            {{ row.activo ? 'Activo' : 'Inactivo' }}
          </BaseBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <RouterLink :to="`/tenants/${row.id}`">
              <BaseButton size="sm" variant="secondary">Ver detalle</BaseButton>
            </RouterLink>
            <BaseButton
              size="sm"
              :variant="row.activo ? 'danger' : 'secondary'"
              @click="openStatusModal(row)"
            >
              {{ row.activo ? 'Desactivar' : 'Activar' }}
            </BaseButton>
          </div>
        </template>
      </BaseTable>

      <div v-if="meta && meta.totalPages > 1" class="px-4 border-t border-gray-100">
        <BasePagination
          :current-page="page"
          :total-pages="meta.totalPages"
          :total="meta.total"
          @page-change="page = $event"
        />
      </div>
    </div>

    <!-- Status confirmation modal -->
    <BaseModal
      :show="showStatusModal"
      :title="selectedTenant?.activo ? 'Desactivar colegio' : 'Activar colegio'"
      size="sm"
      @close="showStatusModal = false"
    >
      <p class="text-sm text-gray-700">
        ¿Está seguro que desea
        <strong>{{ selectedTenant?.activo ? 'desactivar' : 'activar' }}</strong>
        el colegio <strong>{{ selectedTenant?.nombre }}</strong>?
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="showStatusModal = false">Cancelar</BaseButton>
        <BaseButton
          :variant="selectedTenant?.activo ? 'danger' : 'primary'"
          :loading="statusMutation.isPending.value"
          @click="confirmStatusChange"
        >
          {{ selectedTenant?.activo ? 'Desactivar' : 'Activar' }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { PlusIcon } from 'lucide-vue-next';
import { tenantsService } from '../../api/services/tenants.service';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseTable from '../../components/ui/BaseTable.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BasePagination from '../../components/ui/BasePagination.vue';
import BaseModal from '../../components/ui/BaseModal.vue';

const queryClient = useQueryClient();

const search = ref('');
const filterPlan = ref('');
const filterActivo = ref('');
const page = ref(1);

// Debounce search
const debouncedSearch = ref('');
let debounceTimer: ReturnType<typeof setTimeout>;
watch(search, (val) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = val;
    page.value = 1;
  }, 300);
});

watch([filterPlan, filterActivo], () => { page.value = 1; });

const queryParams = computed(() => ({
  page: page.value,
  limit: 20,
  ...(debouncedSearch.value && { search: debouncedSearch.value }),
  ...(filterPlan.value && { plan: filterPlan.value }),
  ...(filterActivo.value !== '' && { activo: filterActivo.value === 'true' }),
}));

const { data: result, isFetching } = useQuery({
  queryKey: ['tenants', queryParams],
  queryFn: () => tenantsService.getTenants(queryParams.value),
  staleTime: 30_000,
});

const tenants = computed(() => result.value?.data ?? []);
const meta = computed(() => result.value?.meta ?? null);

const columns = [
  { key: 'nombre', label: 'Nombre / Slug' },
  { key: 'codigoModular', label: 'Cód. Modular', width: '140px' },
  { key: 'plan', label: 'Plan', width: '120px' },
  { key: 'estado', label: 'Estado', width: '100px' },
];

// Status change modal
const showStatusModal = ref(false);
const selectedTenant = ref<any>(null);

function openStatusModal(tenant: any) {
  selectedTenant.value = tenant;
  showStatusModal.value = true;
}

const statusMutation = useMutation({
  mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
    tenantsService.updateTenantStatus(id, activo),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    showStatusModal.value = false;
    selectedTenant.value = null;
  },
});

function confirmStatusChange() {
  if (!selectedTenant.value) return;
  statusMutation.mutate({
    id: selectedTenant.value.id,
    activo: !selectedTenant.value.activo,
  });
}

function planLabel(plan: string): string {
  const map: Record<string, string> = {
    basico: 'Básico',
    profesional: 'Profesional',
    enterprise: 'Enterprise',
  };
  return map[plan] ?? plan;
}

function planVariant(plan: string): 'neutral' | 'info' | 'success' {
  switch (plan) {
    case 'profesional': return 'info';
    case 'enterprise':  return 'success';
    default:            return 'neutral';
  }
}
</script>
