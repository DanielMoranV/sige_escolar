<template>
  <div class="relative">
    <!-- Nivel Primaria: Selector AD/A/B/C -->
    <div v-if="nivel === 'PRIMARIA'" class="flex items-center gap-1">
      <button
        v-for="opt in literalOptions"
        :key="opt"
        @click="!disabled && updateLiteral(opt)"
        :disabled="disabled"
        class="w-8 h-8 rounded-md text-xs font-bold transition-all border flex items-center justify-center"
        :class="[
          disabled
            ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
            : literalValue === opt
              ? getLiteralClass(opt)
              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
        ]"
      >
        {{ opt }}
      </button>
    </div>

    <!-- Nivel Secundaria: Input 0-20 -->
    <div v-else class="w-16">
      <input
        type="number"
        v-model="numericValue"
        min="0"
        max="20"
        :disabled="disabled"
        @blur="emitNumeric"
        @keyup.enter="emitNumeric"
        class="w-full text-center py-1 border rounded-md text-sm font-semibold focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all"
        :class="[
          disabled
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : numericValue !== null && numericValue < 11
              ? 'text-red-600 border-red-200 bg-red-50'
              : 'text-gray-900 border-gray-200'
        ]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  nivel: 'PRIMARIA' | 'SECUNDARIA';
  literal?: string | null;
  numerico?: number | null;
  disabled?: boolean;
}>();

const emit = defineEmits(['update:literal', 'update:numerico', 'change']);

const literalValue = ref<string | null>(props.literal ?? null);
const numericValue = ref<number | null>(props.numerico ?? null);

const literalOptions = ['AD', 'A', 'B', 'C'];

watch(() => props.literal, (val) => literalValue.value = val ?? null);
watch(() => props.numerico, (val) => numericValue.value = val ?? null);

function updateLiteral(val: string) {
  const newValue = literalValue.value === val ? null : val;
  literalValue.value = newValue;
  emit('update:literal', newValue);
  emit('change');
}

function emitNumeric() {
  if (numericValue.value !== null && numericValue.value !== undefined) {
    if (numericValue.value < 0) numericValue.value = 0;
    if (numericValue.value > 20) numericValue.value = 20;
  }
  emit('update:numerico', numericValue.value);
  emit('change');
}

function getLiteralClass(opt: string) {
  switch (opt) {
    case 'AD': return 'bg-blue-600 text-white border-blue-600 shadow-sm';
    case 'A':  return 'bg-green-600 text-white border-green-600 shadow-sm';
    case 'B':  return 'bg-yellow-500 text-white border-yellow-500 shadow-sm';
    case 'C':  return 'bg-red-600 text-white border-red-600 shadow-sm';
    default:   return 'bg-white text-gray-400 border-gray-200';
  }
}
</script>
