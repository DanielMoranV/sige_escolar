<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Reportes y Documentos</h1>
      <p class="text-gray-500 mt-1">Genere libretas de notas, informes de rendimiento y documentos oficiales.</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="pb-4 text-sm font-medium transition-colors relative"
          :class="activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'"
        >
          {{ tab.label }}
          <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="mt-6">
      <LibretasTab v-if="activeTab === 'libretas'" />
      <RendimientoTab v-else-if="activeTab === 'rendimiento'" />
      <ConfiguracionPDFTab v-else-if="activeTab === 'config'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LibretasTab from './tabs/LibretasTab.vue';
import RendimientoTab from './tabs/RendimientoTab.vue';
import ConfiguracionPDFTab from './tabs/ConfiguracionPDFTab.vue';

const activeTab = ref('libretas');

const tabs = [
  { id: 'libretas', label: 'Libretas de Notas' },
  { id: 'rendimiento', label: 'Rendimiento Académico' },
  { id: 'config', label: 'Configuración PDF' },
];
</script>
