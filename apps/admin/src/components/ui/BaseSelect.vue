<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="selectId" class="text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      :class="[
        'block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        error
          ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
          : 'border-gray-300 focus:border-blue-400 focus:ring-blue-200',
        disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white',
      ]"
    >
      <option value="" disabled>Seleccionar...</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >{{ option.label }}</option>
    </select>
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modelValue?: string;
  label?: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}>(), {
  required: false,
  disabled: false,
});

defineEmits<{
  'update:modelValue': [value: string];
}>();

const selectId = computed(() => props.id ?? `select-${Math.random().toString(36).slice(2, 8)}`);
</script>
