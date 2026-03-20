<template>
  <div class="flex items-center justify-between py-3">
    <p class="text-sm text-gray-600">
      Mostrando página <span class="font-medium">{{ currentPage }}</span> de
      <span class="font-medium">{{ totalPages }}</span>
      <span class="ml-1 text-gray-400">({{ total }} registros)</span>
    </p>
    <div class="flex items-center gap-1">
      <button
        :disabled="currentPage <= 1"
        @click="$emit('page-change', currentPage - 1)"
        class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Anterior
      </button>

      <template v-for="p in pages" :key="p">
        <span v-if="p === '...'" class="px-2 py-1 text-gray-400">...</span>
        <button
          v-else
          @click="$emit('page-change', p as number)"
          :class="[
            'px-3 py-1.5 text-sm rounded-lg border transition-colors',
            p === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50',
          ]"
        >
          {{ p }}
        </button>
      </template>

      <button
        :disabled="currentPage >= totalPages"
        @click="$emit('page-change', currentPage + 1)"
        class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Siguiente
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  currentPage: number;
  totalPages: number;
  total: number;
}>();

defineEmits<{
  'page-change': [page: number];
}>();

const pages = computed(() => {
  const total = props.totalPages;
  const current = props.currentPage;
  const result: Array<number | string> = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) result.push(i);
    return result;
  }

  result.push(1);
  if (current > 3) result.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    result.push(i);
  }
  if (current < total - 2) result.push('...');
  result.push(total);

  return result;
});
</script>
