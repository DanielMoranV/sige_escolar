<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
      <!-- Logo / Marca -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background-color: var(--color-primary-600)">
          <span class="text-white font-bold text-2xl">S</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">SIGE Escolar</h1>
        <p class="text-gray-500 text-sm mt-1">Panel de Administración</p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="admin@sige.edu.pe"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style="--tw-ring-color: var(--color-primary-500)"
            :class="{ 'border-red-400': errors.email }"
            autocomplete="email"
            required
          />
          <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              :class="{ 'border-red-400': errors.password }"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              tabindex="-1"
            >
              <EyeOffIcon v-if="showPassword" class="w-4 h-4" />
              <EyeIcon v-else class="w-4 h-4" />
            </button>
          </div>
          <p v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</p>
        </div>

        <!-- Error general -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p class="text-red-600 text-sm">{{ errorMessage }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 px-4 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style="background-color: var(--color-primary-600)"
        >
          <span v-if="loading">Ingresando...</span>
          <span v-else>Ingresar</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { EyeIcon, EyeOffIcon } from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth.store';

const authStore = useAuthStore();
const router = useRouter();

const showPassword = ref(false);
const form = ref({ email: '', password: '' });
const errors = ref<{ email?: string; password?: string }>({});
const errorMessage = ref('');
const loading = ref(false);

async function handleLogin() {
  errors.value = {};
  errorMessage.value = '';

  if (!form.value.email) {
    errors.value.email = 'El email es requerido';
    return;
  }
  if (!form.value.password) {
    errors.value.password = 'La contraseña es requerida';
    return;
  }

  loading.value = true;
  try {
    await authStore.login(form.value.email, form.value.password);
    router.push('/dashboard');
  } catch (err: any) {
    const msg = err?.response?.data?.message;
    errorMessage.value = msg ?? 'Error al iniciar sesión. Verifica tus credenciales.';
  } finally {
    loading.value = false;
  }
}
</script>
