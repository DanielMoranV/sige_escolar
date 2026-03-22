<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <button @click="router.back()" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
        <ArrowLeftIcon class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Nueva Matrícula</h1>
        <p class="text-gray-500 mt-0.5">Registre la matrícula de un estudiante para el año escolar actual.</p>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <!-- Stepper -->
      <div class="flex border-b border-gray-100">
        <div v-for="step in 2" :key="step" class="flex-1 py-3 text-center text-sm font-medium" :class="currentStep === step ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'">
          Paso {{ step }}: {{ step === 1 ? 'Buscar Estudiante' : 'Datos de Matrícula' }}
        </div>
      </div>

      <div class="p-6">
        <!-- Paso 1: Buscar Estudiante -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Buscar estudiante por DNI</label>
            <div class="flex gap-2">
              <div class="flex-1 relative">
                <SearchIcon class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="searchDni"
                  type="text"
                  placeholder="DNI de 8 dígitos"
                  maxlength="8"
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  @keyup.enter="buscarEstudiante"
                />
              </div>
              <BaseButton :loading="isSearching" @click="buscarEstudiante">Buscar</BaseButton>
            </div>
          </div>

          <!-- Resultado de búsqueda -->
          <div v-if="estudianteEncontrado" class="p-4 rounded-xl border border-blue-100 bg-blue-50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {{ estudianteEncontrado.nombres[0] }}{{ estudianteEncontrado.apellido_paterno[0] }}
              </div>
              <div>
                <p class="font-semibold text-blue-900">{{ estudianteEncontrado.apellido_paterno }} {{ estudianteEncontrado.apellido_materno }}, {{ estudianteEncontrado.nombres }}</p>
                <p class="text-xs text-blue-700">DNI: {{ estudianteEncontrado.dni }}</p>
              </div>
            </div>
            <BaseBadge variant="info">Seleccionado</BaseBadge>
          </div>

          <div v-else-if="searchAttempted" class="text-center py-8">
            <p class="text-gray-500 text-sm mb-4">No se encontró ningún estudiante con ese DNI.</p>
            <BaseButton variant="secondary" @click="router.push('/estudiantes/nuevo')">Registrar Estudiante Nuevo</BaseButton>
          </div>
        </div>

        <!-- Paso 2: Datos de Matrícula -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseSelect
              v-model="form.seccionId"
              label="Grado y Sección"
              :options="seccionesOptions"
              required
            />
            <BaseSelect
              v-model="form.tipoMatricula"
              label="Tipo de Matrícula"
              :options="tiposMatricula"
              required
            />
            <BaseSelect
              v-model="form.condicionMatricula"
              label="Condición"
              :options="condicionesMatricula"
              required
            />
            <BaseInput v-model="form.fechaMatricula" label="Fecha de Matrícula" type="date" required />
            <BaseInput v-model="form.fechaInicio" label="Fecha de Inicio" type="date" required />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput v-model="form.ieProcedencia" label="I.E. de Procedencia" placeholder="Opcional" />
            <BaseInput v-model="form.codigoModularProcedencia" label="Cód. Modular Procedencia" placeholder="7 dígitos" maxlength="7" />
          </div>
        </div>

        <!-- Navegación -->
        <div class="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <BaseButton v-if="currentStep > 1" variant="secondary" @click="currentStep--">
            Anterior
          </BaseButton>
          <div v-else />
          
          <BaseButton v-if="currentStep === 1" :disabled="!estudianteEncontrado" @click="currentStep = 2">
            Continuar
            <ArrowRightIcon class="w-4 h-4" />
          </BaseButton>
          <BaseButton v-else :loading="isSubmitting" @click="submit">
            Confirmar Matrícula
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, ArrowRightIcon, SearchIcon } from 'lucide-vue-next';
import { estudiantesService } from '../../api/services/estudiantes.service';
import { matriculasService } from '../../api/services/matriculas.service';
import { schoolConfigService } from '../../api/services/school-config.service';
import { hoyLima } from '../../utils/date';
import { useToast } from '../../composables/useToast';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';

const toast = useToast();

const router = useRouter();
const currentStep = ref(1);
const isSearching = ref(false);
const searchAttempted = ref(false);
const isSubmitting = ref(false);
const estudianteEncontrado = ref<any>(null);
const searchDni = ref('');
const anioEscolar = ref<any>(null);

const form = ref({
  estudianteId: '',
  seccionId: '',
  anioEscolarId: '',
  tipoMatricula: 'CONTINUIDAD',
  condicionMatricula: 'PROMOVIDO',
  fechaMatricula: hoyLima(),
  fechaInicio: '',
  ieProcedencia: '',
  codigoModularProcedencia: '',
  repeticionesEnNivel: 0,
});

const seccionesOptions = ref<any[]>([]);

const tiposMatricula = [
  { label: 'Continuidad', value: 'CONTINUIDAD' },
  { label: 'Ingreso', value: 'INGRESO' },
  { label: 'Reincorporación', value: 'REINCORPORACION' },
  { label: 'Traslado', value: 'TRASLADO' },
];

const condicionesMatricula = [
  { label: 'Promovido', value: 'PROMOVIDO' },
  { label: 'Repite', value: 'REPITE' },
  { label: 'Ingresante', value: 'INGRESANTE' },
];

onMounted(async () => {
  const [anio, secc] = await Promise.all([
    schoolConfigService.getAnioEscolar(),
    schoolConfigService.getSecciones(),
  ]);
  anioEscolar.value = anio;
  form.value.anioEscolarId = anio.id;
  form.value.fechaInicio = anio.fecha_inicio;
  
  seccionesOptions.value = secc.map((s: any) => ({
    label: `(${s.nivel}) ${s.grado_nombre} - ${s.nombre}`,
    value: s.id
  }));
});

async function buscarEstudiante() {
  if (searchDni.value.length !== 8) return;
  
  isSearching.value = true;
  searchAttempted.value = false;
  estudianteEncontrado.value = null;
  
  try {
    const response = await estudiantesService.getEstudiantes(1, 1, searchDni.value);
    if (response.data && response.data.length > 0) {
      estudianteEncontrado.value = response.data[0];
      form.value.estudianteId = estudianteEncontrado.value.id;
    }
    searchAttempted.value = true;
  } catch {
    toast.error('Error al buscar el estudiante');
  } finally {
    isSearching.value = false;
  }
}

async function submit() {
  if (!form.value.seccionId) {
    toast.warning('Seleccione una sección');
    return;
  }

  isSubmitting.value = true;
  try {
    await matriculasService.createMatricula(form.value);
    toast.success('Matrícula registrada correctamente');
    router.push('/matriculas');
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Error al registrar matrícula');
  } finally {
    isSubmitting.value = false;
  }
}
</script>
