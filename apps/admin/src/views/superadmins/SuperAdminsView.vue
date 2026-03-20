<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Super Administradores</h1>
        <p class="text-gray-500 mt-1">Gestión de usuarios con acceso total al sistema.</p>
      </div>
      <BaseButton @click="showCreateModal = true">
        <PlusIcon class="w-4 h-4" />
        Nuevo superadmin
      </BaseButton>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200">
      <BaseTable
        :columns="columns"
        :data="superadmins ?? []"
        :loading="isPending"
      >
        <template #cell-nombre="{ row }">
          <div>
            <p class="font-medium text-gray-900">{{ row.nombres }} {{ row.apellidos }}</p>
            <p class="text-xs text-gray-400">{{ row.email }}</p>
          </div>
        </template>

        <template #cell-estado="{ row }">
          <BaseBadge :variant="row.activo ? 'success' : 'danger'">
            {{ row.activo ? 'Activo' : 'Inactivo' }}
          </BaseBadge>
        </template>

        <template #cell-creado="{ row }">
          <span class="text-sm text-gray-600">{{ formatDate(row.created_at) }}</span>
        </template>

        <template #actions="{ row }">
          <BaseButton
            size="sm"
            variant="danger"
            :disabled="row.id === authStore.user?.id"
            :title="row.id === authStore.user?.id ? 'No puedes eliminarte a ti mismo' : undefined"
            @click="openDeleteModal(row)"
          >
            <TrashIcon class="w-4 h-4" />
          </BaseButton>
        </template>
      </BaseTable>
    </div>

    <!-- Create modal -->
    <BaseModal
      :show="showCreateModal"
      title="Nuevo Super Administrador"
      size="md"
      @close="closeCreateModal"
    >
      <form @submit.prevent="submitCreate" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <BaseInput
            v-model="createForm.nombres"
            label="Nombres"
            required
            :error="createErrors.nombres"
          />
          <BaseInput
            v-model="createForm.apellidos"
            label="Apellidos"
            required
            :error="createErrors.apellidos"
          />
        </div>
        <BaseInput
          v-model="createForm.email"
          label="Correo electrónico"
          type="email"
          required
          :error="createErrors.email"
        />
        <BaseInput
          v-model="createForm.password"
          label="Contraseña"
          type="password"
          required
          :error="createErrors.password"
        />
        <div v-if="createMutation.isError.value" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Error al crear el superadmin. Verifique los datos.
        </div>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="closeCreateModal">Cancelar</BaseButton>
        <BaseButton :loading="createMutation.isPending.value" @click="submitCreate">
          Crear superadmin
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Delete confirm modal -->
    <BaseModal
      :show="showDeleteModal"
      title="Eliminar Super Administrador"
      size="sm"
      @close="showDeleteModal = false"
    >
      <p class="text-sm text-gray-700">
        ¿Está seguro de eliminar al superadmin
        <strong>{{ selectedSuperadmin?.nombres }} {{ selectedSuperadmin?.apellidos }}</strong>?
        Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="showDeleteModal = false">Cancelar</BaseButton>
        <BaseButton
          variant="danger"
          :loading="deleteMutation.isPending.value"
          @click="confirmDelete"
        >
          Eliminar
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { PlusIcon, TrashIcon } from 'lucide-vue-next';
import { superadminsService } from '../../api/services/superadmins.service';
import { useAuthStore } from '../../stores/auth.store';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseTable from '../../components/ui/BaseTable.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseModal from '../../components/ui/BaseModal.vue';

const authStore = useAuthStore();
const queryClient = useQueryClient();

const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const selectedSuperadmin = ref<any>(null);

const createForm = ref({ nombres: '', apellidos: '', email: '', password: '' });
const createErrors = ref<Record<string, string>>({});

const columns = [
  { key: 'nombre', label: 'Nombre / Email' },
  { key: 'estado', label: 'Estado', width: '100px' },
  { key: 'creado', label: 'Creado', width: '140px' },
];

const { data: superadmins, isPending } = useQuery({
  queryKey: ['superadmins'],
  queryFn: () => superadminsService.getSuperadmins(),
  staleTime: 60_000,
});

const createMutation = useMutation({
  mutationFn: (payload: any) => superadminsService.createSuperadmin(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['superadmins'] });
    closeCreateModal();
  },
});

const deleteMutation = useMutation({
  mutationFn: (id: string) => superadminsService.deleteSuperadmin(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['superadmins'] });
    showDeleteModal.value = false;
    selectedSuperadmin.value = null;
  },
});

function validateCreateForm(): boolean {
  const e: Record<string, string> = {};
  if (!createForm.value.nombres.trim()) e.nombres = 'Campo requerido';
  if (!createForm.value.apellidos.trim()) e.apellidos = 'Campo requerido';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.value.email))
    e.email = 'Email inválido';
  if (createForm.value.password.length < 8)
    e.password = 'La contraseña debe tener al menos 8 caracteres';
  createErrors.value = e;
  return Object.keys(e).length === 0;
}

function submitCreate() {
  if (!validateCreateForm()) return;
  createMutation.mutate({
    nombres: createForm.value.nombres,
    apellidos: createForm.value.apellidos,
    email: createForm.value.email,
    password: createForm.value.password,
  });
}

function closeCreateModal() {
  showCreateModal.value = false;
  createForm.value = { nombres: '', apellidos: '', email: '', password: '' };
  createErrors.value = {};
}

function openDeleteModal(row: any) {
  selectedSuperadmin.value = row;
  showDeleteModal.value = true;
}

function confirmDelete() {
  if (!selectedSuperadmin.value) return;
  deleteMutation.mutate(selectedSuperadmin.value.id);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
</script>
