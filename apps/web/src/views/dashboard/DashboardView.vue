<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Bienvenido, {{ authStore.user?.nombres }}</h2>
      <p class="text-gray-500 text-sm mt-1">Panel de gestión escolar — {{ new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
    </div>

    <!-- Stat Cards placeholder -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="card in statCards" :key="card.label" class="bg-white rounded-xl border border-gray-200 p-5">
        <p class="text-sm text-gray-500 font-medium">{{ card.label }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ card.value }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth.store';

const authStore = useAuthStore();

const statCards = [
  { label: 'Estudiantes', value: '—' },
  { label: 'Secciones', value: '—' },
  { label: 'Asistencia hoy', value: '—' },
  { label: 'Alertas activas', value: '—' },
];
</script>
