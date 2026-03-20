<template>
  <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
    <div>
      <h1 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h1>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-500">{{ authStore.user?.email }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';

const route = useRoute();
const authStore = useAuthStore();

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
  };
  return titles[route.path] ?? 'SIGE Admin';
});
</script>
