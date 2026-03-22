<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Mis Secciones</h1>
      <p class="text-gray-500 mt-1">Áreas y secciones asignadas para el año escolar.</p>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="h-32 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <div v-else-if="asignaciones.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="asig in asignaciones"
        :key="asig.id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 hover:border-blue-300 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="font-semibold text-gray-900 text-sm">{{ asig.area_nombre }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ asig.grado_nombre }} — {{ asig.seccion_nombre }}</p>
          </div>
          <span v-if="asig.es_tutor" class="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">Tutor</span>
        </div>
        <div class="flex gap-2 pt-1">
          <router-link
            :to="`/notas?seccionId=${asig.seccion_id}&areaId=${asig.area_ie_id}`"
            class="flex-1"
          >
            <BaseButton size="sm" class="w-full">
              <GraduationCapIcon class="w-3.5 h-3.5" />
              Notas
            </BaseButton>
          </router-link>
          <router-link
            v-if="asig.es_tutor"
            :to="`/asistencia?seccionId=${asig.seccion_id}`"
            class="flex-1"
          >
            <BaseButton size="sm" variant="secondary" class="w-full">
              <CheckCircleIcon class="w-3.5 h-3.5" />
              Asistencia
            </BaseButton>
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <p class="text-gray-500">No tienes secciones asignadas para este año escolar.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { GraduationCapIcon, CheckCircleIcon } from 'lucide-vue-next';
import { docentesService } from '../../api/services/docentes.service';
import { useToast } from '../../composables/useToast';
import BaseButton from '../../components/ui/BaseButton.vue';

const toast = useToast();
const asignaciones = ref<any[]>([]);
const isLoading = ref(false);

onMounted(async () => {
  isLoading.value = true;
  try {
    asignaciones.value = await docentesService.getMisAsignaciones();
  } catch {
    toast.error('Error al cargar las asignaciones');
  } finally {
    isLoading.value = false;
  }
});
</script>
