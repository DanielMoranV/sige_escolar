<template>
  <div ref="anchorRef" @mouseenter="onEnter" @mouseleave="onLeave">
    <RouterLink
      :to="item.path"
      class="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors"
      :class="isActive ? 'text-white' : 'text-blue-200 hover:text-white'"
      :style="isActive ? { backgroundColor: 'var(--sidebar-active)' } : {}"
      active-class=""
    >
      <component :is="item.icon" class="w-5 h-5 shrink-0" />
      <span v-if="!collapsed" class="text-sm font-medium truncate">{{ item.label }}</span>
    </RouterLink>

    <Teleport v-if="collapsed && visible" to="body">
      <div
        class="pointer-events-none fixed z-[9999] transition-opacity duration-150"
        :style="{ top: tooltipY + 'px', left: tooltipX + 'px', transform: 'translateY(-50%)' }"
      >
        <div class="relative bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-lg">
          {{ item.label }}
          <span class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, RouterLink } from 'vue-router';

const props = defineProps<{
  item: { label: string; path: string; icon: any };
  collapsed: boolean;
}>();

const route = useRoute();
const isActive = computed(() => route.path === props.item.path || route.path.startsWith(props.item.path + '/'));

const anchorRef = ref<HTMLElement | null>(null);
const visible = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);

function onEnter() {
  if (!anchorRef.value) return;
  const rect = anchorRef.value.getBoundingClientRect();
  tooltipX.value = rect.right + 12;
  tooltipY.value = rect.top + rect.height / 2;
  visible.value = true;
}

function onLeave() {
  visible.value = false;
}
</script>
