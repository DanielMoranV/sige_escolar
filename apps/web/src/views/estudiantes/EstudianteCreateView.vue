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
        <div v-for="step in 3" :key="step" class="flex-1 py-3 text-center text-sm font-medium" :class="currentStep === step ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'">
          Paso {{ step }}
        </div>
      </div>

      <div class="p-6">
        <!-- Paso 1: Identificación -->
        <div v-if="currentStep === 1" class="space-y-6">
          <!-- Banner: datos verificados -->
          <div v-if="dniVerificado" class="bg-green-50 p-4 rounded-xl border border-green-200 flex gap-3">
            <CheckCircleIcon class="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div class="text-sm text-green-800">
              <p class="font-medium">Datos obtenidos automáticamente.</p>
              <p class="mt-0.5 text-green-700">Complete los campos que no pudieron recuperarse (fecha de nacimiento, género).</p>
            </div>
          </div>

          <!-- Banner: lookup falló, modo manual -->
          <div v-else-if="lookupFailed" class="bg-amber-50 p-4 rounded-xl border border-amber-200 flex gap-3">
            <AlertTriangleIcon class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p class="text-sm text-amber-800">
              No se pudo obtener los datos automáticamente. Complete los campos manualmente.
            </p>
          </div>

          <!-- Banner: instrucción inicial -->
          <div v-else class="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
            <InfoIcon class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p class="text-sm text-blue-800">
              Ingrese el DNI para autocompletar los datos del estudiante. Si el servicio no está disponible, puede ingresarlos manualmente.
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
              Validar DNI
            </BaseButton>
          </div>

          <!-- Enlace para ingresar manualmente sin validar -->
          <div v-if="!showManualForm" class="text-center">
            <button
              type="button"
              @click="habilitarManual"
              class="text-sm text-gray-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
            >
              Ingresar datos manualmente
            </button>
          </div>

          <!-- Formulario de datos personales (auto o manual) -->
          <div v-if="showManualForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <!-- Paso 3: Apoderado -->
        <div v-if="currentStep === 3" class="space-y-6">
          <ComponenteApoderado v-model="apoderado" />
        </div>

        <!-- Navegación -->
        <div class="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <BaseButton v-if="currentStep > 1" variant="secondary" @click="currentStep--">
            Anterior
          </BaseButton>
          <div v-else />
          
          <BaseButton v-if="currentStep < 3" @click="nextStep">
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
import { useQueryClient } from '@tanstack/vue-query';
import { ArrowLeftIcon, ArrowRightIcon, SearchIcon, InfoIcon, CheckCircleIcon, AlertTriangleIcon } from 'lucide-vue-next';
import { estudiantesService } from '../../api/services/estudiantes.service';
import { hoyLima } from '../../utils/date';
import { useToast } from '../../composables/useToast';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import ComponenteApoderado from '../../components/ui/ComponenteApoderado.vue';
import apiClient from '../../api/client';

const toast = useToast();

const router = useRouter();
const queryClient = useQueryClient();
const currentStep = ref(1);
const isValidating = ref(false);
const isSubmitting = ref(false);
const showManualForm = ref(false);
const dniVerificado = ref(false);
const lookupFailed = ref(false);

const apoderado = ref<any>({});

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

function habilitarManual() {
  showManualForm.value = true;
  lookupFailed.value = false;
  dniVerificado.value = false;
  form.value.numeroDocumento = form.value.dni;
}

async function validateDni() {
  if (!form.value.dni || form.value.dni.length !== 8) {
    errors.value.dni = 'Ingrese un DNI válido de 8 dígitos';
    return;
  }

  errors.value.dni = '';
  isValidating.value = true;
  lookupFailed.value = false;
  dniVerificado.value = false;

  try {
    const data = await estudiantesService.validateDni(form.value.dni);
    form.value.nombres = data.nombres;
    form.value.apellidoPaterno = data.apellidoPaterno;
    form.value.apellidoMaterno = data.apellidoMaterno;
    if (data.fechaNacimiento) form.value.fechaNacimiento = data.fechaNacimiento;
    if (data.genero) form.value.genero = data.genero;
    if (data.ubigeo) form.value.ubigeoNacimiento = data.ubigeo;
    form.value.numeroDocumento = form.value.dni;
    showManualForm.value = true;
    dniVerificado.value = true;
  } catch {
    lookupFailed.value = true;
    showManualForm.value = true;
    form.value.numeroDocumento = form.value.dni;
  } finally {
    isValidating.value = false;
  }
}

function validarFechaNacimiento(fecha: string): string | null {
  if (!fecha) return 'La fecha de nacimiento es obligatoria.';

  const hoyStr = hoyLima();
  if (fecha >= hoyStr) return 'La fecha de nacimiento no puede ser hoy ni una fecha futura.';

  // Parse as local dates (split to avoid UTC off-by-one from new Date('YYYY-MM-DD'))
  const [fy, fm, fd] = fecha.split('-').map(Number);
  const [hy, hm, hd] = hoyStr.split('-').map(Number);
  const fechaDate = new Date(fy, fm - 1, fd);
  const hoyLocal = new Date(hy, hm - 1, hd);

  const anios = (hoyLocal.getTime() - fechaDate.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (anios < 2) return 'La fecha indica menos de 2 años de edad. Verifique.';
  if (anios > 25) return 'La fecha indica más de 25 años de edad. Verifique.';

  return null;
}

function nextStep() {
  if (currentStep.value === 1) {
    if (!showManualForm.value) {
      toast.warning('Valide el DNI o use "Ingresar datos manualmente" para continuar');
      return;
    }
    if (!form.value.nombres || !form.value.apellidoPaterno) {
      toast.warning('Complete los campos obligatorios: nombres y apellido paterno');
      return;
    }
    const errorFecha = validarFechaNacimiento(form.value.fechaNacimiento);
    if (errorFecha) {
      errors.value.fechaNacimiento = errorFecha;
      toast.warning(errorFecha);
      return;
    }
    errors.value.fechaNacimiento = '';
    if (!form.value.genero) {
      toast.warning('Seleccione el género del estudiante');
      return;
    }
  }
  currentStep.value++;
}

async function submit() {
  isSubmitting.value = true;
  try {
    const raw = { ...form.value, numeroDocumento: form.value.dni || form.value.numeroDocumento };
    // Los campos opcionales con restricciones de formato (ej. @Length(6,6)) fallan si
    // se envían como string vacío — class-validator solo salta @IsOptional() con undefined/null.
    const optionals = ['codigoSiagie', 'ubigeoNacimiento', 'etnia', 'tipoDiscapacidad', 'apellidoMaterno'] as const;
    for (const key of optionals) {
      if (!raw[key]) delete raw[key];
    }
    const estudiante = await estudiantesService.createEstudiante(raw);

    if (apoderado.value && apoderado.value.numeroDocumento) {
      await apiClient.post('/apoderados', {
        ...apoderado.value,
        estudianteId: estudiante.id
      });
    }

    toast.success('Estudiante registrado correctamente');
    queryClient.invalidateQueries({ queryKey: ['estudiantes'] });
    router.push('/estudiantes');
  } catch (err: any) {
    const errData = err?.response?.data;
    const detail = Array.isArray(errData?.errors) ? errData.errors.join(' | ') : errData?.message;
    toast.error(detail || 'Error al registrar estudiante');
  } finally {
    isSubmitting.value = false;
  }
}
</script>
