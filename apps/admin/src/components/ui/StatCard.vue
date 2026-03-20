<template>
  <div
    :class="[
      'bg-white rounded-xl border p-5 flex items-start gap-4',
      borderColorClass,
    ]"
  >
    <div :class="['p-3 rounded-xl', iconBgClass]">
      <component :is="icon" :class="['w-6 h-6', iconColorClass]" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm text-gray-500 truncate">{{ title }}</p>
      <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ value }}</p>
      <p v-if="trend" class="text-xs text-gray-400 mt-0.5">{{ trend }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}>(), {
  color: 'blue',
});

const iconBgClass = computed(() => {
  switch (props.color) {
    case 'green':  return 'bg-green-100';
    case 'yellow': return 'bg-yellow-100';
    case 'red':    return 'bg-red-100';
    default:       return 'bg-blue-100';
  }
});

const iconColorClass = computed(() => {
  switch (props.color) {
    case 'green':  return 'text-green-600';
    case 'yellow': return 'text-yellow-600';
    case 'red':    return 'text-red-600';
    default:       return 'text-blue-600';
  }
});

const borderColorClass = computed(() => {
  switch (props.color) {
    case 'green':  return 'border-green-200';
    case 'yellow': return 'border-yellow-200';
    case 'red':    return 'border-red-200';
    default:       return 'border-blue-200';
  }
});
</script>
