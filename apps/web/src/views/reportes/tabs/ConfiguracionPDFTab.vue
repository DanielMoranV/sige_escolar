<template>
  <div class="max-w-2xl space-y-6">
    <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <h3 class="text-lg font-bold text-gray-900">Personalización de Documentos</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Logo del Colegio</label>
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
              <ImageIcon class="w-8 h-8" />
            </div>
            <BaseButton variant="secondary" size="sm">Subir Imagen</BaseButton>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="config.colorPrimario" label="Color Primario" type="color" />
          <BaseInput v-model="config.colorSecundario" label="Color Secundario" type="color" />
        </div>

        <BaseInput v-model="config.nombreDirector" label="Nombre del Director (para firma)" />
        
        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="config.mostrarFoto" class="w-4 h-4 text-blue-600 rounded border-gray-300" />
            <span class="text-sm text-gray-700">Mostrar foto del estudiante en libreta</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="config.incluirAsistencia" class="w-4 h-4 text-blue-600 rounded border-gray-300" />
            <span class="text-sm text-gray-700">Incluir resumen de asistencia</span>
          </label>
        </div>
      </div>

      <div class="flex justify-end pt-4 border-t">
        <BaseButton @click="handleSave">Guardar Configuración</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ImageIcon } from 'lucide-vue-next';
import BaseInput from '../../../components/ui/BaseInput.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';

const config = ref({
  colorPrimario: '#1A5276',
  colorSecundario: '#2E86C1',
  nombreDirector: '',
  mostrarFoto: false,
  incluirAsistencia: true,
});

function handleSave() {
  alert('Configuración guardada correctamente.');
}
</script>
