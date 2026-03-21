<template>
  <div class="space-y-4 bg-white p-6 rounded-xl border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900">Datos del Apoderado</h3>
    
    <div class="space-y-4">
      <div class="flex gap-2 items-end">
        <div class="flex-1">
          <BaseInput
            v-model="searchDni"
            label="Buscar por DNI"
            placeholder="Ingrese DNI del apoderado"
            maxlength="8"
            @keyup.enter="buscarApoderado"
          />
        </div>
        <BaseButton variant="secondary" :loading="isSearching" @click="buscarApoderado">
          <SearchIcon class="w-4 h-4" />
          Buscar
        </BaseButton>
      </div>

      <div v-if="apoderadoEncontrado" class="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex justify-between items-center">
        <span>Vinculando a: <strong>{{ apoderadoEncontrado.nombres }} {{ apoderadoEncontrado.apellido_paterno }}</strong></span>
        <button @click="resetApoderado" class="text-blue-500 hover:text-blue-700 underline text-xs">Cambiar</button>
      </div>
      
      <div v-if="!apoderadoEncontrado" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BaseInput v-model="form.nombres" label="Nombres" required />
        <BaseInput v-model="form.apellidoPaterno" label="Apellido Paterno" required />
        <BaseInput v-model="form.apellidoMaterno" label="Apellido Materno" />
        <BaseInput v-model="form.telefono" label="Teléfono" />
        <BaseInput v-model="form.email" label="Correo Electrónico" type="email" class="md:col-span-2" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
        <BaseSelect
          v-model="form.parentesco"
          label="Parentesco"
          :options="parentescos"
          required
        />
        <div class="flex flex-col justify-center space-y-2">
          <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" v-model="form.esApoderadoPrincipal" class="rounded text-blue-600 focus:ring-blue-500">
            Es apoderado principal
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" v-model="form.viveConEstudiante" class="rounded text-blue-600 focus:ring-blue-500">
            Vive con el estudiante
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { SearchIcon } from 'lucide-vue-next';
import apiClient from '../../api/client';
import BaseInput from './BaseInput.vue';
import BaseSelect from './BaseSelect.vue';
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  modelValue: any;
}>();

const emit = defineEmits(['update:modelValue']);

const searchDni = ref('');
const isSearching = ref(false);
const apoderadoEncontrado = ref<any>(null);

const form = ref({
  dni: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  telefono: '',
  email: '',
  parentesco: 'PADRE',
  esApoderadoPrincipal: true,
  viveConEstudiante: true,
});

watch(form, (val) => {
  if (apoderadoEncontrado.value) {
    emit('update:modelValue', {
      ...apoderadoEncontrado.value,
      apoderadoExistenteId: apoderadoEncontrado.value.id,
      parentesco: val.parentesco,
      esApoderadoPrincipal: val.esApoderadoPrincipal,
      viveConEstudiante: val.viveConEstudiante,
    });
  } else {
    emit('update:modelValue', val);
  }
}, { deep: true, immediate: true });

const parentescos = [
  { label: 'Padre', value: 'PADRE' },
  { label: 'Madre', value: 'MADRE' },
  { label: 'Abuelo(a)', value: 'ABUELO' },
  { label: 'Hermano(a)', value: 'HERMANO' },
  { label: 'Tío(a)', value: 'TIO' },
  { label: 'Apoderado Legal', value: 'APODERADO_LEGAL' },
  { label: 'Otro', value: 'OTRO' },
];

async function buscarApoderado() {
  if (!searchDni.value || searchDni.value.length < 8) return;
  isSearching.value = true;
  try {
    const { data } = await apiClient.get(`/apoderados?q=${searchDni.value}`);
    if (data && data.data) {
      apoderadoEncontrado.value = data.data;
      form.value.dni = data.data.dni;
      form.value.numeroDocumento = data.data.numero_documento;
      alert('Apoderado encontrado y vinculado.');
    } else {
      alert('Apoderado no encontrado, por favor llene sus datos.');
      form.value.dni = searchDni.value;
      form.value.numeroDocumento = searchDni.value;
    }
  } catch (error) {
    console.error(error);
  } finally {
    isSearching.value = false;
  }
}

function resetApoderado() {
  apoderadoEncontrado.value = null;
  searchDni.value = '';
  form.value = {
    dni: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    email: '',
    parentesco: 'PADRE',
    esApoderadoPrincipal: true,
    viveConEstudiante: true,
  };
}
</script>
