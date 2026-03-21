<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <button @click="router.back()" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
        <ArrowLeftIcon class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Editar Estudiante</h1>
        <p class="text-gray-500 mt-0.5">Actualice los datos del estudiante.</p>
      </div>
    </div>

    <div v-if="isLoading" class="p-12 text-center">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
    </div>

    <div v-else-if="form" class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      <!-- Identificación (solo lectura) -->
      <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
        <p class="font-medium text-gray-700 mb-1">Documento de identidad</p>
        <p>{{ form.tipoDocumento }} — <span class="font-mono font-semibold">{{ form.dni || form.numeroDocumento }}</span></p>
        <p class="text-xs text-gray-400 mt-1">El número de documento no puede modificarse desde aquí.</p>
      </div>

      <!-- Datos personales -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BaseInput v-model="form.nombres" label="Nombres" required :error="errors.nombres" />
        <BaseInput v-model="form.apellidoPaterno" label="Apellido Paterno" required :error="errors.apellidoPaterno" />
        <BaseInput v-model="form.apellidoMaterno" label="Apellido Materno" />
        <BaseInput v-model="form.fechaNacimiento" label="Fecha de Nacimiento" type="date" required :error="errors.fechaNacimiento" />
        <BaseSelect
          v-model="form.genero"
          label="Género"
          :options="[{ label: 'Masculino', value: 'M' }, { label: 'Femenino', value: 'F' }]"
          required
          :error="errors.genero"
        />
        <BaseInput v-model="form.codigoSiagie" label="Código SIAGIE" placeholder="Opcional" />
      </div>

      <!-- Información complementaria -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <BaseInput v-model="form.ubigeoNacimiento" label="Ubigeo Nacimiento" placeholder="6 dígitos" maxlength="6" />
        <BaseInput v-model="form.lenguaMaterna" label="Lengua Materna" />
        <BaseInput v-model="form.etnia" label="Etnia / Centro Poblado" placeholder="Opcional" />
      </div>

      <div class="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" v-model="form.tieneDiscapacidad" class="w-4 h-4 text-blue-600 rounded border-gray-300" />
          <span class="text-sm font-medium text-gray-700">¿Tiene alguna discapacidad?</span>
        </label>
        <div v-if="form.tieneDiscapacidad">
          <BaseInput v-model="form.tipoDiscapacidad" label="Especifique la discapacidad" placeholder="Ej: Visual, Motriz..." />
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
        <BaseButton :loading="isSubmitting" @click="submit">Guardar Cambios</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import { ArrowLeftIcon } from 'lucide-vue-next';
import { estudiantesService } from '../../api/services/estudiantes.service';
import { useToast } from '../../composables/useToast';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseButton from '../../components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const queryClient = useQueryClient();

const estudianteId = route.params.id as string;
const isLoading = ref(true);
const isSubmitting = ref(false);
const errors = ref<Record<string, string>>({});

const form = ref<any>(null);

// Cargar datos actuales
estudiantesService.getEstudiante(estudianteId).then((data) => {
  form.value = {
    dni:              data.dni ?? '',
    tipoDocumento:    data.tipo_documento ?? 'DNI',
    numeroDocumento:  data.numero_documento ?? '',
    nombres:          data.nombres ?? '',
    apellidoPaterno:  data.apellido_paterno ?? '',
    apellidoMaterno:  data.apellido_materno ?? '',
    fechaNacimiento:  data.fecha_nacimiento ? data.fecha_nacimiento.toString().split('T')[0] : '',
    genero:           data.genero ?? '',
    codigoSiagie:     data.codigo_siagie ?? '',
    ubigeoNacimiento: data.ubigeo_nacimiento ?? '',
    lenguaMaterna:    data.lengua_materna ?? 'CASTELLANO',
    etnia:            data.etnia ?? '',
    tieneDiscapacidad: data.tiene_discapacidad ?? false,
    tipoDiscapacidad: data.tipo_discapacidad ?? '',
  };
  isLoading.value = false;
}).catch(() => {
  toast.error('No se pudo cargar el estudiante');
  router.back();
});

async function submit() {
  errors.value = {};

  if (!form.value.nombres) { errors.value.nombres = 'Requerido'; return; }
  if (!form.value.apellidoPaterno) { errors.value.apellidoPaterno = 'Requerido'; return; }
  if (!form.value.fechaNacimiento) { errors.value.fechaNacimiento = 'Requerida'; return; }
  if (!form.value.genero) { errors.value.genero = 'Requerido'; return; }

  isSubmitting.value = true;
  try {
    const payload: any = {
      nombres:         form.value.nombres,
      apellidoPaterno: form.value.apellidoPaterno,
      apellidoMaterno: form.value.apellidoMaterno || undefined,
      codigoSiagie:    form.value.codigoSiagie || undefined,
      tieneDiscapacidad: form.value.tieneDiscapacidad,
      tipoDiscapacidad:  form.value.tieneDiscapacidad ? form.value.tipoDiscapacidad || undefined : undefined,
    };

    await estudiantesService.updateEstudiante(estudianteId, payload);
    queryClient.invalidateQueries({ queryKey: ['estudiantes'] });
    queryClient.invalidateQueries({ queryKey: ['estudiante-detalle', estudianteId] });
    toast.success('Estudiante actualizado correctamente');
    router.push(`/estudiantes/${estudianteId}`);
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al actualizar');
  } finally {
    isSubmitting.value = false;
  }
}
</script>
