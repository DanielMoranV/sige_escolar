<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-800">Exoneraciones</h3>
      <BaseButton size="sm" variant="secondary" @click="showForm = !showForm">
        {{ showForm ? 'Cancelar' : 'Añadir Exoneración' }}
      </BaseButton>
    </div>

    <div v-if="showForm" class="p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseSelect v-model="form.areaIeId" label="Área" :options="areas" required />
      <BaseSelect v-model="form.tipo" label="Tipo" :options="tipos" required />
      <BaseInput v-model="form.motivo" label="Motivo" required class="md:col-span-2" />
      <BaseInput v-model="form.fechaSolicitud" type="date" label="Fecha Solicitud" required />
      <div class="flex items-end">
        <BaseButton @click="submit" :loading="isSubmitting" class="w-full">Registrar</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import apiClient from '../../api/client';
import { hoyLima } from '../../utils/date';
import BaseInput from './BaseInput.vue';
import BaseSelect from './BaseSelect.vue';
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  matriculaId: string;
}>();

const queryClient = useQueryClient();
const showForm = ref(false);
const isSubmitting = ref(false);

const form = ref({
  areaIeId: '',
  tipo: 'RELIGION',
  motivo: '',
  fechaSolicitud: hoyLima(),
});

const tipos = [
  { label: 'Religión', value: 'RELIGION' },
  { label: 'Educación Física', value: 'EDUCACION_FISICA' },
  { label: 'Otro', value: 'OTRO' },
];

const areas = ref<any[]>([]);

onMounted(async () => {
  try {
    const { data } = await apiClient.get('/config/areas');
    // Filtrar áreas que permiten exoneración
    areas.value = (data.data || []).filter((a: any) => a.permite_exoneracion).map((a: any) => ({
      label: a.nombre_display,
      value: a.id
    }));
  } catch (error) {
    console.error('Error fetching areas:', error);
  }
});

async function submit() {
  if (!form.value.areaIeId || !form.value.motivo) return;
  isSubmitting.value = true;
  try {
    await apiClient.post('/exoneraciones', {
      matriculaId: props.matriculaId,
      ...form.value
    });
    showForm.value = false;
    form.value.motivo = '';
    queryClient.invalidateQueries({ queryKey: ['estudiante-detalle'] });
    alert('Exoneración registrada correctamente');
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Error al registrar exoneración');
  } finally {
    isSubmitting.value = false;
  }
}
</script>
