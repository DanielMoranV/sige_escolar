<template>
  <div class="overflow-x-auto rounded-xl border border-gray-200">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="col.width ? `width: ${col.width}` : undefined"
            class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            {{ col.label }}
          </th>
          <th v-if="$slots.actions" class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-100">
        <!-- Loading skeleton -->
        <template v-if="loading">
          <tr v-for="n in 5" :key="`skeleton-${n}`">
            <td
              v-for="col in columns"
              :key="`skeleton-cell-${col.key}`"
              class="px-4 py-3"
            >
              <div class="h-4 bg-gray-200 rounded animate-pulse" />
            </td>
            <td v-if="$slots.actions" class="px-4 py-3">
              <div class="h-4 bg-gray-200 rounded animate-pulse w-20 ml-auto" />
            </td>
          </tr>
        </template>

        <!-- Empty state -->
        <tr v-else-if="!data.length">
          <td
            :colspan="columns.length + ($slots.actions ? 1 : 0)"
            class="px-4 py-12 text-center text-sm text-gray-400"
          >
            No hay registros para mostrar.
          </td>
        </tr>

        <!-- Data rows -->
        <tr
          v-else
          v-for="(row, rowIndex) in data"
          :key="rowIndex"
          class="hover:bg-gray-50 transition-colors"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-sm text-gray-900"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="px-4 py-3 text-right">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  columns: Array<{ key: string; label: string; width?: string }>;
  data: Array<Record<string, any>>;
  loading?: boolean;
}>();
</script>
