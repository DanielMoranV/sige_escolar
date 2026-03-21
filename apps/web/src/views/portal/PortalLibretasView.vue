<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { portalService } from '@/api/services/portal.service';
import BaseButton from '@/components/ui/BaseButton.vue';
import { ArrowDownTrayIcon, DocumentIcon } from '@heroicons/vue/24/outline';

const libretasData = ref<any>(null);
const loading = ref(true);
const downloading = ref<string | null>(null);

onMounted(async () => {
  try {
    libretasData.value = await portalService.getLibretas();
  } catch (error) {
    console.error('Error al cargar libretas', error);
  } finally {
    loading.value = false;
  }
});

const download = async (periodoId: string) => {
  downloading.value = periodoId;
  try {
    const blob = await portalService.downloadLibreta(libretasData.value.estudiante.matricula_id, periodoId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Libreta_${periodoId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error al descargar libreta', error);
  } finally {
    downloading.value = null;
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h1 class="text-2xl font-bold text-gray-900">Libretas de Notas (Informes de Progreso)</h1>
      <p class="text-gray-500 mt-1">Descarga los documentos oficiales de cada periodo del año escolar.</p>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="h-40 bg-gray-200 animate-pulse rounded-lg"></div>
    </div>

    <div v-else-if="libretasData?.libretas?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="libreta in libretasData.libretas" :key="libreta.periodo_id" 
           class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-4 hover:border-primary-300 transition-colors">
        <div class="bg-blue-50 p-4 rounded-full">
          <DocumentIcon class="h-10 w-10 text-primary-600" />
        </div>
        <div>
          <h3 class="font-bold text-lg text-gray-900">{{ libreta.periodo_nombre }}</h3>
          <p class="text-sm text-gray-500">Documento PDF Oficial</p>
        </div>
        <BaseButton 
          block 
          @click="download(libreta.periodo_id)"
          :loading="downloading === libreta.periodo_id"
        >
          <template #icon>
            <ArrowDownTrayIcon class="h-5 w-5 mr-2" />
          </template>
          Descargar PDF
        </BaseButton>
      </div>
    </div>

    <div v-else class="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
      <DocumentIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay libretas disponibles</h3>
      <p class="mt-1 text-sm text-gray-500">Las libretas aparecerán aquí una vez que la dirección las publique.</p>
    </div>
  </div>
</template>
