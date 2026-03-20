<template>
  <RouterLink
    :to="item.path"
    class="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors group"
    :class="[
      isActive
        ? 'text-white'
        : 'text-blue-200 hover:text-white',
    ]"
    :style="isActive ? { backgroundColor: 'var(--sidebar-active)' } : {}"
    :title="collapsed ? item.label : undefined"
    active-class=""
  >
    <component :is="item.icon" class="w-5 h-5 shrink-0" />
    <span
      v-if="!collapsed"
      class="text-sm font-medium truncate transition-opacity"
    >{{ item.label }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';

const props = defineProps<{
  item: { label: string; path: string; icon: any };
  collapsed: boolean;
}>();

const route = useRoute();
const isActive = computed(() => route.path === props.item.path || route.path.startsWith(props.item.path + '/'));
</script>
