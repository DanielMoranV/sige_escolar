<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <RouterLink to="/tenants" class="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
        <ArrowLeftIcon class="w-5 h-5" />
      </RouterLink>
      <div class="flex-1 min-w-0">
        <div v-if="isPending" class="space-y-2">
          <div class="h-6 bg-gray-200 rounded w-64 animate-pulse" />
          <div class="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <template v-else-if="tenant">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900 truncate">{{ tenant.nombre }}</h1>
            <BaseBadge :variant="tenant.activo ? 'success' : 'danger'">
              {{ tenant.activo ? 'Activo' : 'Inactivo' }}
            </BaseBadge>
          </div>
          <p class="text-gray-500 mt-0.5 font-mono text-sm">slug: {{ tenant.slug }}</p>
        </template>
      </div>
      <div v-if="tenant" class="flex items-center gap-2 shrink-0">
        <RouterLink :to="`/tenants/${tenantId}/editar`">
          <BaseButton variant="secondary" size="sm">
            <PencilIcon class="w-4 h-4" />
            Editar
          </BaseButton>
        </RouterLink>
        <BaseButton
          :variant="tenant.activo ? 'danger' : 'primary'"
          size="sm"
          @click="showStatusModal = true"
        >
          {{ tenant.activo ? 'Desactivar' : 'Activar' }}
        </BaseButton>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="isError" class="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
      Error al cargar los datos del colegio.
    </div>

    <template v-if="tenant">
      <!-- Stats row -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">
            <span v-if="statsLoading" class="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded" />
            <span v-else>{{ stats?.estudiantes ?? '—' }}</span>
          </p>
          <p class="text-sm text-gray-500 mt-0.5">Estudiantes</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">
            <span v-if="statsLoading" class="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded" />
            <span v-else>{{ stats?.usuarios ?? '—' }}</span>
          </p>
          <p class="text-sm text-gray-500 mt-0.5">Usuarios</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-sm font-semibold text-gray-700">
            <span v-if="statsLoading" class="inline-block w-24 h-5 bg-gray-200 animate-pulse rounded" />
            <span v-else>{{ formatDate(stats?.ultimoAcceso) }}</span>
          </p>
          <p class="text-sm text-gray-500 mt-0.5">Último acceso</p>
        </div>
      </div>

      <!-- Data sections -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Datos básicos -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <p class="text-sm font-semibold text-gray-700">Datos básicos</p>
          </div>
          <div class="divide-y divide-gray-100">
            <div class="flex justify-between px-4 py-2.5 text-sm">
              <span class="text-gray-500">Nombre</span>
              <span class="font-medium">{{ tenant.nombre }}</span>
            </div>
            <div class="flex justify-between px-4 py-2.5 text-sm">
              <span class="text-gray-500">Slug</span>
              <span class="font-mono">{{ tenant.slug }}</span>
            </div>
            <div class="flex justify-between px-4 py-2.5 text-sm">
              <span class="text-gray-500">Plan</span>
              <BaseBadge :variant="planVariant(tenant.plan)">{{ planLabel(tenant.plan) }}</BaseBadge>
            </div>
            <div class="flex justify-between px-4 py-2.5 text-sm">
              <span class="text-gray-500">Creado</span>
              <span>{{ formatDate(tenant.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Datos MINEDU -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <p class="text-sm font-semibold text-gray-700">Datos MINEDU</p>
          </div>
          <div class="divide-y divide-gray-100">
            <template v-if="tenant.datos_minedu">
              <div class="flex justify-between px-4 py-2.5 text-sm">
                <span class="text-gray-500">Cód. Modular</span>
                <span class="font-mono">{{ tenant.datos_minedu.codigo_modular }}</span>
              </div>
              <div class="flex justify-between px-4 py-2.5 text-sm">
                <span class="text-gray-500">Nombre oficial</span>
                <span class="text-right max-w-[200px]">{{ tenant.datos_minedu.nombre_oficial }}</span>
              </div>
              <div class="flex justify-between px-4 py-2.5 text-sm">
                <span class="text-gray-500">DRE</span>
                <span>{{ tenant.datos_minedu.dre_nombre }}</span>
              </div>
              <div class="flex justify-between px-4 py-2.5 text-sm">
                <span class="text-gray-500">UGEL</span>
                <span>{{ tenant.datos_minedu.ugel_nombre }}</span>
              </div>
              <div class="flex justify-between px-4 py-2.5 text-sm">
                <span class="text-gray-500">Tipo gestión</span>
                <span>{{ tenant.datos_minedu.tipo_gestion }}</span>
              </div>
            </template>
            <div v-else class="px-4 py-4 text-sm text-gray-400 text-center">
              Sin datos MINEDU registrados
            </div>
          </div>
        </div>

        <!-- Niveles Educativos -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <p class="text-sm font-semibold text-gray-700">Niveles educativos</p>
          </div>
          <div class="divide-y divide-gray-100">
            <template v-if="tenant.regimen_config && tenant.regimen_config.length > 0">
              <div v-for="rc in tenant.regimen_config" :key="rc.nivel" class="flex justify-between px-4 py-2.5 text-sm">
                <span class="text-gray-500">{{ formatNivel(rc.nivel) }}</span>
                <span class="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                  {{ formatRegimen(rc.tipo_regimen) }}
                </span>
              </div>
            </template>
            <div v-else class="px-4 py-4 text-sm text-gray-400 text-center">
              Sin niveles configurados
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Status modal -->
    <BaseModal
      :show="showStatusModal"
      :title="tenant?.activo ? 'Desactivar colegio' : 'Activar colegio'"
      size="sm"
      @close="showStatusModal = false"
    >
      <p class="text-sm text-gray-700">
        ¿Confirma que desea
        <strong>{{ tenant?.activo ? 'desactivar' : 'activar' }}</strong>
        el colegio <strong>{{ tenant?.nombre }}</strong>?
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="showStatusModal = false">Cancelar</BaseButton>
        <BaseButton
          :variant="tenant?.activo ? 'danger' : 'primary'"
          :loading="statusMutation.isPending.value"
          @click="confirmStatusChange"
        >
          {{ tenant?.activo ? 'Desactivar' : 'Activar' }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { ArrowLeftIcon, PencilIcon } from 'lucide-vue-next';
import { tenantsService } from '../../api/services/tenants.service';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseModal from '../../components/ui/BaseModal.vue';

const route = useRoute();
const queryClient = useQueryClient();
const tenantId = route.params.id as string;

const showStatusModal = ref(false);

const { data: tenant, isPending, isError } = useQuery({
  queryKey: ['tenant', tenantId],
  queryFn: () => tenantsService.getTenant(tenantId),
});

const { data: stats, isPending: statsLoading } = useQuery({
  queryKey: ['tenant-stats', tenantId],
  queryFn: () => tenantsService.getTenantStats(tenantId),
});

const statusMutation = useMutation({
  mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
    tenantsService.updateTenantStatus(id, activo),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    showStatusModal.value = false;
  },
});

function confirmStatusChange() {
  if (!tenant.value) return;
  statusMutation.mutate({ id: tenantId, activo: !tenant.value.activo });
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function planLabel(plan: string): string {
  const map: Record<string, string> = { basico: 'Básico', profesional: 'Profesional', enterprise: 'Enterprise' };
  return map[plan] ?? plan;
}

function planVariant(plan: string): 'neutral' | 'info' | 'success' {
  switch (plan) {
    case 'profesional': return 'info';
    case 'enterprise': return 'success';
    default: return 'neutral';
  }
}

function formatNivel(nivel: string): string {
  const map: Record<string, string> = {
    INICIAL: 'Inicial',
    PRIMARIA: 'Primaria',
    SECUNDARIA: 'Secundaria',
  };
  return map[nivel] ?? nivel;
}

function formatRegimen(regimen: string): string {
  const map: Record<string, string> = {
    BIMESTRAL: 'Bimestral',
    TRIMESTRAL: 'Trimestral',
    SEMESTRAL: 'Semestral',
  };
  return map[regimen] ?? regimen;
}
</script>
