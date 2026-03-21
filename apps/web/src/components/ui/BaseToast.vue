<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto max-w-sm"
          :class="{
            'bg-green-600 text-white': toast.type === 'success',
            'bg-red-600 text-white': toast.type === 'error',
            'bg-amber-500 text-white': toast.type === 'warning',
          }"
        >
          <CheckCircleIcon v-if="toast.type === 'success'" class="w-4 h-4 shrink-0" />
          <XCircleIcon v-else-if="toast.type === 'error'" class="w-4 h-4 shrink-0" />
          <AlertTriangleIcon v-else class="w-4 h-4 shrink-0" />
          <span class="flex-1">{{ toast.message }}</span>
          <button @click="remove(toast.id)" class="opacity-70 hover:opacity-100 transition-opacity">
            <XIcon class="w-3.5 h-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, XIcon } from 'lucide-vue-next';
import { useToast } from '../../composables/useToast';

const { toasts, remove } = useToast();
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
