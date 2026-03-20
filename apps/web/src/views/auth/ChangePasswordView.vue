<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyIcon class="w-8 h-8" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Actualizar Contraseña</h1>
        <p class="text-gray-500 text-sm mt-1">Por seguridad, debes cambiar tu contraseña temporal antes de continuar.</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal (actual)</label>
          <input
            v-model="form.currentPassword"
            type="password"
            placeholder="••••••••"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
          <input
            v-model="form.newPassword"
            type="password"
            placeholder="Mínimo 8 caracteres"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            minlength="8"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="Repite la nueva contraseña"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p class="text-red-600 text-sm">{{ error }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
        >
          <span v-if="loading">Actualizando...</span>
          <span v-else>Actualizar y continuar</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { KeyIcon } from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth.store';

const authStore = useAuthStore();
const router = useRouter();

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const error = ref('');
const loading = ref(false);

async function handleSubmit() {
  error.value = '';
  
  if (form.value.newPassword !== form.value.confirmPassword) {
    error.value = 'Las nuevas contraseñas no coinciden';
    return;
  }

  if (form.value.newPassword.length < 8) {
    error.value = 'La nueva contraseña debe tener al menos 8 caracteres';
    return;
  }

  loading.value = true;
  try {
    await authStore.changePassword(form.value.currentPassword, form.value.newPassword);
    router.push('/dashboard');
  } catch (err: any) {
    error.value = err?.response?.data?.message ?? 'Error al actualizar la contraseña';
  } finally {
    loading.value = false;
  }
}
</script>
