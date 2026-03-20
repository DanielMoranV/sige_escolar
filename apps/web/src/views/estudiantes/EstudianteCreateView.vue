<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <button @click="router.back()" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
        <ArrowLeftIcon class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Nuevo Estudiante</h1>
        <p class="text-gray-500 mt-0.5">Registre un nuevo estudiante en el sistema.</p>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <!-- Stepper simple -->
      <div class="flex border-b border-gray-100">
        <div v-for="step in 2" :key="step" class="flex-1 py-3 text-center text-sm font-medium" :class="currentStep === step ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'">
          Paso {{ step }}
        </div>
      </div>

      <div class="p-6">
        <!-- Paso 1: Identificación y RENIEC -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
            <InfoIcon class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p class="text-sm text-blue-800">
              Ingrese el DNI para validar la identidad con RENIEC. Esto autocompletará los datos básicos del estudiante.
            </p>
          </div>

          <div class="flex gap-3 items-end">
            <div class="flex-1">
              <BaseInput
                v-model="form.dni"
                label="DNI del Estudiante"
                placeholder="8 dígitos"
                maxlength="8"
                :error="errors.dni"
                @keyup.enter="validateDni"
              />
            </div>
            <BaseButton :loading="isValidating" @click="validateDni" class="mb-1">
              <SearchIcon class="w-4 h-4" />
              Validar
            </BaseButton>
          </div>

          <div v-if="showManualForm" class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
            <BaseInput v-model="form.nombres" label="Nombres" required :error="errors.nombres" />
            <BaseInput v-model="form.apellidoPaterno" label="Apellido Paterno" required :error="errors.apellidoPaterno" />
            <BaseInput v-model="form.apellidoMaterno" label="Apellido Materno" :error="errors.apellidoMaterno" />
            <BaseInput v-model="form.fechaNacimiento" label="Fecha de Nacimiento" type="date" required :error="errors.fechaNacimiento" />
            <BaseSelect
              v-model="form.genero"
              label="Género"
              :options="[{label: 'Masculino', value: 'M'}, {label: 'Femenino', value: 'F'}]"
              required
              :error="errors.genero"
            />
          </div>
        </div>

        <!-- Paso 2: Información Complementaria -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput v-model="form.codigoSiagie" label="Código SIAGIE" placeholder="Opcional" />
            <BaseInput v-model="form.ubigeoNacimiento" label="Ubigeo Nacimiento" placeholder="6 dígitos" maxlength="6" />
            <BaseInput v-model="form.lenguaMaterna" label="Lengua Materna" placeholder="Ej: CASTELLANO" />
            <BaseInput v-model="form.etnia" label="Etnia / Centro Poblado" placeholder="Opcional" />
          </div>

          <div class="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="form.tieneDiscapacidad" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <span class="text-sm font-medium text-gray-700">¿Tiene alguna discapacidad?</span>
            </label>
            <div v-if="form.tieneDiscapacidad" class="animate-in fade-in duration-300">
              <BaseInput v-model="form.tipoDiscapacidad" label="Especifique la discapacidad" placeholder="Ej: Visual, Motriz..." />
            </div>
          </div>
        </div>

        <!-- Navegación -->
        <div class="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <BaseButton v-if="currentStep > 1" variant="secondary" @click="currentStep--">
            Anterior
          </BaseButton>
          <div v-else />
          
          <BaseButton v-if="currentStep < 2" @click="nextStep">
            Siguiente
            <ArrowRightIcon class="w-4 h-4" />
          </BaseButton>
          <BaseButton v-else :loading="isSubmitting" @click="submit">
            Finalizar Registro
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation } from '@tanstack/vue-query';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  SearchIcon, 
  InfoIcon 
} from 'lucide-vue-next';
import { estudiantesService } from '../../api/services/estudiantes.service';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseButton from '../../components/ui/BaseButton.vue';

const router = useRouter();
const currentStep = ref(1);
const isValidating = ref(false);
const isSubmitting = ref(false);
const showManualForm = ref(false);

const form = ref({
  dni: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
  genero: '',
  codigoSiagie: '',
  ubigeoNacimiento: '',
  lenguaMaterna: 'CASTELLANO',
  etnia: '',
  tieneDiscapacidad: false,
  tipoDiscapacidad: '',
});

const errors = ref<Record<string, string>>({});

async function validateDni() {
  if (!form.value.dni || form.value.dni.length !== 8) {
    errors.value.dni = 'Ingrese un DNI válido de 8 dígitos';
    return;
  }
  
  errors.value.dni = '';
  isValidating.value = true;
  try {
    const data = await estudiantesService.validateDni(form.value.dni);
    form.value.nombres = data.nombres;
    form.value.apellidoPaterno = data.apellidoPaterno;
    form.value.apellidoMaterno = data.apellidoMaterno;
    form.value.fechaNacimiento = data.fechaNacimiento;
    form.value.genero = data.genero;
    form.value.numeroDocumento = form.value.dni;
    showManualForm.value = true;
  } catch (err) {
    errors.value.dni = 'No se pudo validar el DNI. Ingrese los datos manualmente.';
    showManualForm.value = true;
  } finally {
    isValidating.value = false;
  }
}

function nextStep() {
  if (currentStep.value === 1) {
    if (!form.value.nombres || !form.value.apellidoPaterno || !form.value.fechaNacimiento) {
      alert('Por favor complete los campos obligatorios');
      return;
    }
  }
  currentStep.value++;
}

const createMutation = useMutation({
  mutationFn: (payload: any) => estudiantesService.createEstudiante(payload),
  onSuccess: () => {
    router.push('/estudiantes');
  }
});

async function submit() {
  isSubmitting.value = true;
  try {
    await createMutation.mutateAsync({
      ...form.value,
      numeroDocumento: form.value.dni || form.value.numeroDocumento
    });
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Error al registrar estudiante');
  } finally {
    isSubmitting.value = false;
  }
}
</script>
