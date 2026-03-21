<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="inputId" class="text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <input
      v-bind="$attrs"
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :class="[
        'block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        error
          ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
          : 'border-gray-300 focus:border-blue-400 focus:ring-blue-200',
        disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white',
      ]"
    />
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  modelValue?: string | number;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  id?: string;
}>(), {
  type: 'text',
  required: false,
  disabled: false,
});

defineEmits<{
  'update:modelValue': [value: string];
}>();

const inputId = computed(() => props.id ?? `input-${Math.random().toString(36).slice(2, 8)}`);
</script>
