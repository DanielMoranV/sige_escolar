<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <RouterLink to="/tenants" class="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
        <ArrowLeftIcon class="w-5 h-5" />
      </RouterLink>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Nuevo Colegio</h1>
        <p class="text-gray-500 mt-0.5">Complete los pasos para registrar una institución educativa.</p>
      </div>
    </div>

    <!-- Step indicator -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <template v-for="(step, idx) in steps" :key="idx">
          <div class="flex flex-col items-center gap-1 flex-1">
            <div :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
              currentStep > idx + 1 ? 'bg-green-500 text-white' :
              currentStep === idx + 1 ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500',
            ]">
              <CheckIcon v-if="currentStep > idx + 1" class="w-4 h-4" />
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <span class="text-xs text-gray-500 hidden sm:block text-center">{{ step }}</span>
          </div>
          <div v-if="idx < steps.length - 1" :class="[
            'h-0.5 flex-1 mx-1 mb-4 rounded',
            currentStep > idx + 1 ? 'bg-green-400' : 'bg-gray-200',
          ]" />
        </template>
      </div>
    </div>

    <!-- Form card -->
    <div class="bg-white rounded-xl border border-gray-200 p-6">

      <!-- Step 1: Datos básicos -->
      <div v-if="currentStep === 1" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Datos básicos</h2>
        <BaseInput v-model="form.nombre" label="Nombre del colegio" placeholder="Ej: I.E. Santa Rosa de Lima" required :error="errors.nombre" />
        <BaseInput v-model="form.nombreCorto" label="Nombre corto (slug)" placeholder="Ej: santa_rosa" required :error="errors.nombreCorto" />
        <div v-if="form.nombreCorto" class="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          Slug generado: <span class="font-mono font-medium text-blue-700">{{ computedSlug }}</span>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700 mb-2">Plan <span class="text-red-500">*</span></p>
          <div class="grid grid-cols-3 gap-3">
            <label v-for="plan in plans" :key="plan.value" :class="['cursor-pointer rounded-xl border-2 p-4 transition-colors', form.plan === plan.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300']">
              <input type="radio" v-model="form.plan" :value="plan.value" class="sr-only" />
              <p class="font-semibold text-gray-900 text-sm">{{ plan.label }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ plan.desc }}</p>
            </label>
          </div>
          <p v-if="errors.plan" class="text-xs text-red-600 mt-1">{{ errors.plan }}</p>
        </div>
      </div>

      <!-- Step 2: Datos MINEDU -->
      <div v-if="currentStep === 2" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Datos MINEDU</h2>
        <BaseInput v-model="form.codigoModular" label="Código Modular (7 dígitos)" placeholder="1234567" required :error="errors.codigoModular" />
        <BaseInput v-model="form.nombreOficial" label="Nombre oficial de la IE" placeholder="I.E. N° 123 Santa Rosa de Lima" required :error="errors.nombreOficial" />
        <div class="grid grid-cols-2 gap-4">
          <BaseSelect v-model="form.dreCodigo" label="DRE" required :options="dreOptions" :error="errors.dreCodigo" @update:modelValue="onDreChange" />
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">UGEL (código) <span class="text-red-500">*</span></label>
            <input v-model="form.ugelCodigo" type="text" placeholder="Ej: 01" :class="['block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2', errors.ugelCodigo ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200']" />
            <p v-if="errors.ugelCodigo" class="text-xs text-red-600">{{ errors.ugelCodigo }}</p>
          </div>
        </div>
        <BaseInput v-model="form.ugelNombre" label="UGEL (nombre)" placeholder="Ej: UGEL 01 - San Juan de Miraflores" required :error="errors.ugelNombre" />
        <div>
          <p class="text-sm font-medium text-gray-700 mb-2">Tipo de gestión <span class="text-red-500">*</span></p>
          <div class="flex flex-wrap gap-3">
            <label v-for="tipo in tiposGestion" :key="tipo.value" :class="['cursor-pointer rounded-lg border-2 px-4 py-2 text-sm transition-colors', form.tipoGestion === tipo.value ? 'border-blue-500 bg-blue-50 font-medium text-blue-700' : 'border-gray-200']">
              <input type="radio" v-model="form.tipoGestion" :value="tipo.value" class="sr-only" />
              {{ tipo.label }}
            </label>
          </div>
          <p v-if="errors.tipoGestion" class="text-xs text-red-600 mt-1">{{ errors.tipoGestion }}</p>
        </div>
      </div>

      <!-- Step 3: Director -->
      <div v-if="currentStep === 3" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Datos del Director</h2>
        <BaseInput v-model="form.directorDni" label="DNI del director (8 dígitos)" placeholder="12345678" required :error="errors.directorDni" />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="form.directorNombres" label="Nombres" placeholder="Juan Carlos" required :error="errors.directorNombres" />
          <BaseInput v-model="form.directorApellidos" label="Apellidos" placeholder="García López" required :error="errors.directorApellidos" />
        </div>
        <BaseInput v-model="form.directorEmail" label="Correo electrónico" type="email" placeholder="director@ie.edu.pe" required :error="errors.directorEmail" />
      </div>

      <!-- Step 4: Niveles y año escolar -->
      <div v-if="currentStep === 4" class="space-y-5">
        <h2 class="text-lg font-semibold text-gray-900">Niveles educativos y año escolar</h2>

        <!-- Selección de niveles -->
        <div>
          <p class="text-sm font-medium text-gray-700 mb-2">Niveles que ofrece el colegio <span class="text-red-500">*</span></p>
          <div class="grid grid-cols-3 gap-3">
            <label v-for="n in nivelesOpciones" :key="n.value" :class="[
              'cursor-pointer rounded-xl border-2 p-4 transition-colors',
              form.niveles.includes(n.value) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
            ]">
              <input type="checkbox" :value="n.value" v-model="form.niveles" class="sr-only" />
              <p class="font-semibold text-gray-900 text-sm">{{ n.label }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ n.desc }}</p>
            </label>
          </div>
          <p v-if="errors.niveles" class="text-xs text-red-600 mt-1">{{ errors.niveles }}</p>
        </div>

        <!-- Año escolar -->
        <BaseInput v-model="form.anioEscolar" label="Año escolar" type="number" placeholder="2026" required :error="errors.anioEscolar" />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="form.fechaInicio" label="Fecha de inicio" type="date" required :error="errors.fechaInicio" />
          <BaseInput v-model="form.fechaFin" label="Fecha de fin" type="date" required :error="errors.fechaFin" />
        </div>

        <!-- Régimen por nivel — solo aparece si el nivel está seleccionado -->
        <div v-if="form.niveles.includes('INICIAL')" class="p-4 rounded-xl border border-gray-200 space-y-2">
          <p class="text-sm font-medium text-gray-700">Régimen Inicial <span class="text-red-500">*</span></p>
          <div class="flex flex-wrap gap-3">
            <label v-for="r in regimenes" :key="`ini-${r.value}`" :class="['cursor-pointer rounded-lg border-2 px-4 py-2 text-sm transition-colors', form.regimenInicial === r.value ? 'border-blue-500 bg-blue-50 font-medium text-blue-700' : 'border-gray-200']">
              <input type="radio" v-model="form.regimenInicial" :value="r.value" class="sr-only" />
              {{ r.label }}
            </label>
          </div>
          <p v-if="errors.regimenInicial" class="text-xs text-red-600">{{ errors.regimenInicial }}</p>
        </div>

        <div v-if="form.niveles.includes('PRIMARIA')" class="p-4 rounded-xl border border-gray-200 space-y-2">
          <p class="text-sm font-medium text-gray-700">Régimen Primaria <span class="text-red-500">*</span></p>
          <div class="flex flex-wrap gap-3">
            <label v-for="r in regimenes" :key="`pri-${r.value}`" :class="['cursor-pointer rounded-lg border-2 px-4 py-2 text-sm transition-colors', form.regimenPrimaria === r.value ? 'border-blue-500 bg-blue-50 font-medium text-blue-700' : 'border-gray-200']">
              <input type="radio" v-model="form.regimenPrimaria" :value="r.value" class="sr-only" />
              {{ r.label }}
            </label>
          </div>
          <p v-if="errors.regimenPrimaria" class="text-xs text-red-600">{{ errors.regimenPrimaria }}</p>
        </div>

        <div v-if="form.niveles.includes('SECUNDARIA')" class="p-4 rounded-xl border border-gray-200 space-y-2">
          <p class="text-sm font-medium text-gray-700">Régimen Secundaria <span class="text-red-500">*</span></p>
          <div class="flex flex-wrap gap-3">
            <label v-for="r in regimenes" :key="`sec-${r.value}`" :class="['cursor-pointer rounded-lg border-2 px-4 py-2 text-sm transition-colors', form.regimenSecundaria === r.value ? 'border-blue-500 bg-blue-50 font-medium text-blue-700' : 'border-gray-200']">
              <input type="radio" v-model="form.regimenSecundaria" :value="r.value" class="sr-only" />
              {{ r.label }}
            </label>
          </div>
          <p v-if="errors.regimenSecundaria" class="text-xs text-red-600">{{ errors.regimenSecundaria }}</p>
        </div>
      </div>

      <!-- Step 5: Summary -->
      <div v-if="currentStep === 5" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Resumen — confirme los datos</h2>

        <div v-if="createMutation.isError.value" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Error al crear el colegio. Revise los datos e intente nuevamente.
        </div>

        <!-- Datos básicos -->
        <div class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos básicos</p>
          </div>
          <div class="divide-y divide-gray-100">
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Nombre</span><span class="font-medium">{{ form.nombre }}</span></div>
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Slug</span><span class="font-mono">{{ computedSlug }}</span></div>
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Plan</span><span class="font-medium">{{ planLabel(form.plan) }}</span></div>
          </div>
        </div>

        <!-- MINEDU -->
        <div class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos MINEDU</p>
          </div>
          <div class="divide-y divide-gray-100">
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Código modular</span><span class="font-mono">{{ form.codigoModular }}</span></div>
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Nombre oficial</span><span class="font-medium">{{ form.nombreOficial }}</span></div>
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">DRE</span><span>{{ form.dreNombre }}</span></div>
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">UGEL</span><span>{{ form.ugelCodigo }} — {{ form.ugelNombre }}</span></div>
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Tipo gestión</span><span>{{ form.tipoGestion }}</span></div>
          </div>
        </div>

        <!-- Director -->
        <div class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Director</p>
          </div>
          <div class="divide-y divide-gray-100">
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">DNI</span><span class="font-mono">{{ form.directorDni }}</span></div>
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Nombre</span><span>{{ form.directorNombres }} {{ form.directorApellidos }}</span></div>
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Email</span><span class="font-mono">{{ form.directorEmail }}</span></div>
          </div>
        </div>

        <!-- Año escolar -->
        <div class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Año escolar y niveles</p>
          </div>
          <div class="divide-y divide-gray-100">
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Año</span><span>{{ form.anioEscolar }}</span></div>
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Periodo</span><span>{{ form.fechaInicio }} → {{ form.fechaFin }}</span></div>
            <div class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Niveles</span><span>{{ form.niveles.join(', ') }}</span></div>
            <div v-if="form.niveles.includes('INICIAL')" class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Régimen inicial</span><span>{{ form.regimenInicial }}</span></div>
            <div v-if="form.niveles.includes('PRIMARIA')" class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Régimen primaria</span><span>{{ form.regimenPrimaria }}</span></div>
            <div v-if="form.niveles.includes('SECUNDARIA')" class="flex justify-between px-4 py-2 text-sm"><span class="text-gray-500">Régimen secundaria</span><span>{{ form.regimenSecundaria }}</span></div>
          </div>
        </div>
      </div>

      <!-- Navigation buttons -->
      <div class="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
        <BaseButton v-if="currentStep > 1" variant="secondary" @click="currentStep--">
          <ArrowLeftIcon class="w-4 h-4" />
          Anterior
        </BaseButton>
        <div v-else />
        <BaseButton v-if="currentStep < 5" @click="nextStep">
          Siguiente
          <ArrowRightIcon class="w-4 h-4" />
        </BaseButton>
        <BaseButton v-else :loading="createMutation.isPending.value" @click="submit">
          <Building2Icon class="w-4 h-4" />
          Crear colegio
        </BaseButton>
      </div>
    </div>

    <!-- Credentials modal -->
    <BaseModal :show="showCredentialsModal" title="Colegio creado exitosamente" size="md" @close="handleCredentialsClose">
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <CheckCircleIcon class="w-6 h-6 text-green-600 shrink-0" />
          <p class="text-sm text-green-800 font-medium">El colegio ha sido creado correctamente.</p>
        </div>
        <div class="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credenciales del director</p>
          <div class="flex justify-between text-sm"><span class="text-gray-600">Email:</span><span class="font-mono font-medium">{{ createdResult?.directorEmail }}</span></div>
          <div class="flex justify-between text-sm"><span class="text-gray-600">Contraseña temporal:</span><span class="font-mono font-semibold text-blue-700">{{ createdResult?.tempPassword }}</span></div>
          <div class="flex justify-between text-sm"><span class="text-gray-600">Slug:</span><span class="font-mono">{{ createdResult?.slug }}</span></div>
        </div>
        <p class="text-xs text-gray-500">Guarde estas credenciales. La contraseña deberá cambiarse en el primer inicio de sesión.</p>
      </div>
      <template #footer>
        <BaseButton @click="handleCredentialsClose">Ir a la lista de colegios</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  Building2Icon,
  CheckCircleIcon,
} from 'lucide-vue-next';
import { tenantsService } from '../../api/services/tenants.service';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseModal from '../../components/ui/BaseModal.vue';

const router = useRouter();
const queryClient = useQueryClient();

const currentStep = ref(1);
const showCredentialsModal = ref(false);
const createdResult = ref<any>(null);

const steps = ['Básicos', 'MINEDU', 'Director', 'Año escolar', 'Resumen'];

const form = ref({
  nombre: '',
  nombreCorto: '',
  plan: 'basico',
  codigoModular: '',
  nombreOficial: '',
  dreCodigo: '',
  dreNombre: '',
  ugelCodigo: '',
  ugelNombre: '',
  tipoGestion: 'PRIVADA',
  directorDni: '',
  directorNombres: '',
  directorApellidos: '',
  directorEmail: '',
  niveles: ['PRIMARIA', 'SECUNDARIA'] as string[],
  anioEscolar: new Date().getFullYear().toString(),
  fechaInicio: '',
  fechaFin: '',
  regimenInicial: 'BIMESTRAL',
  regimenPrimaria: 'BIMESTRAL',
  regimenSecundaria: 'BIMESTRAL',
});

const errors = ref<Record<string, string>>({});

const computedSlug = computed(() =>
  form.value.nombreCorto
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_'),
);

const plans = [
  { value: 'basico', label: 'Básico', desc: 'Hasta 500 estudiantes' },
  { value: 'profesional', label: 'Profesional', desc: 'Hasta 1500 estudiantes' },
  { value: 'enterprise', label: 'Enterprise', desc: 'Sin límite' },
];

const regimenes = [
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
];

const nivelesOpciones = [
  { value: 'INICIAL', label: 'Inicial', desc: '3 a 5 años' },
  { value: 'PRIMARIA', label: 'Primaria', desc: '1° a 6° grado' },
  { value: 'SECUNDARIA', label: 'Secundaria', desc: '1° a 5° año' },
];

const tiposGestion = [
  { value: 'PRIVADA', label: 'Privada' },
  { value: 'PUBLICA', label: 'Pública' },
  { value: 'CONVENIO', label: 'Convenio' },
];

const DRES = [
  { codigo: '010', nombre: 'DRE Amazonas' },
  { codigo: '020', nombre: 'DRE Áncash' },
  { codigo: '030', nombre: 'DRE Apurímac' },
  { codigo: '040', nombre: 'DRE Arequipa' },
  { codigo: '050', nombre: 'DRE Ayacucho' },
  { codigo: '060', nombre: 'DRE Cajamarca' },
  { codigo: '070', nombre: 'DRE Callao' },
  { codigo: '080', nombre: 'DRE Cusco' },
  { codigo: '090', nombre: 'DRE Huancavelica' },
  { codigo: '100', nombre: 'DRE Huánuco' },
  { codigo: '110', nombre: 'DRE Ica' },
  { codigo: '120', nombre: 'DRE Junín' },
  { codigo: '130', nombre: 'DRE La Libertad' },
  { codigo: '140', nombre: 'DRE Lambayeque' },
  { codigo: '150', nombre: 'DRE Lima Metropolitana' },
  { codigo: '160', nombre: 'DRE Lima Provincias' },
  { codigo: '170', nombre: 'DRE Loreto' },
  { codigo: '180', nombre: 'DRE Madre de Dios' },
  { codigo: '190', nombre: 'DRE Moquegua' },
  { codigo: '200', nombre: 'DRE Pasco' },
  { codigo: '210', nombre: 'DRE Piura' },
  { codigo: '220', nombre: 'DRE Puno' },
  { codigo: '230', nombre: 'DRE San Martín' },
  { codigo: '240', nombre: 'DRE Tacna' },
  { codigo: '250', nombre: 'DRE Tumbes' },
  { codigo: '260', nombre: 'DRE Ucayali' },
];

const dreOptions = computed(() => [
  { value: '', label: 'Seleccionar DRE...' },
  ...DRES.map((d) => ({ value: d.codigo, label: d.nombre })),
]);

function onDreChange(codigo: string) {
  const dre = DRES.find((d) => d.codigo === codigo);
  form.value.dreNombre = dre?.nombre ?? '';
}

function validateStep(step: number): boolean {
  const e: Record<string, string> = {};

  if (step === 1) {
    if (!form.value.nombre.trim() || form.value.nombre.length < 3)
      e.nombre = 'El nombre debe tener al menos 3 caracteres';
    if (!form.value.nombreCorto.trim() || form.value.nombreCorto.length < 2)
      e.nombreCorto = 'El nombre corto debe tener al menos 2 caracteres';
    if (!form.value.plan)
      e.plan = 'Seleccione un plan';
  }
  if (step === 2) {
    if (!/^\d{7}$/.test(form.value.codigoModular))
      e.codigoModular = 'Debe tener exactamente 7 dígitos';
    if (!form.value.nombreOficial.trim())
      e.nombreOficial = 'Campo requerido';
    if (!form.value.dreCodigo)
      e.dreCodigo = 'Seleccione una DRE';
    if (!form.value.ugelCodigo.trim())
      e.ugelCodigo = 'Campo requerido';
    if (!form.value.ugelNombre.trim())
      e.ugelNombre = 'Campo requerido';
    if (!form.value.tipoGestion)
      e.tipoGestion = 'Seleccione el tipo de gestión';
  }
  if (step === 3) {
    if (!/^\d{8}$/.test(form.value.directorDni))
      e.directorDni = 'Debe tener exactamente 8 dígitos';
    if (!form.value.directorNombres.trim())
      e.directorNombres = 'Campo requerido';
    if (!form.value.directorApellidos.trim())
      e.directorApellidos = 'Campo requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.directorEmail))
      e.directorEmail = 'Email inválido';
  }
  if (step === 4) {
    if (form.value.niveles.length === 0)
      e.niveles = 'Seleccione al menos un nivel educativo';
    const anio = parseInt(form.value.anioEscolar);
    if (isNaN(anio) || anio < 2020 || anio > 2099)
      e.anioEscolar = 'Año inválido (2020-2099)';
    if (!form.value.fechaInicio)
      e.fechaInicio = 'Campo requerido';
    if (!form.value.fechaFin)
      e.fechaFin = 'Campo requerido';
    if (form.value.niveles.includes('INICIAL') && !form.value.regimenInicial)
      e.regimenInicial = 'Seleccione un régimen';
    if (form.value.niveles.includes('PRIMARIA') && !form.value.regimenPrimaria)
      e.regimenPrimaria = 'Seleccione un régimen';
    if (form.value.niveles.includes('SECUNDARIA') && !form.value.regimenSecundaria)
      e.regimenSecundaria = 'Seleccione un régimen';
  }

  errors.value = e;
  return Object.keys(e).length === 0;
}

function nextStep() {
  if (validateStep(currentStep.value)) {
    currentStep.value++;
  }
}

const createMutation = useMutation({
  mutationFn: (payload: any) => tenantsService.createTenant(payload),
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    createdResult.value = data;
    showCredentialsModal.value = true;
  },
});

function submit() {
  createMutation.mutate({
    nombre: form.value.nombre,
    nombreCorto: form.value.nombreCorto,
    plan: form.value.plan,
    codigoModular: form.value.codigoModular,
    nombreOficial: form.value.nombreOficial,
    dreCodigo: form.value.dreCodigo,
    dreNombre: form.value.dreNombre,
    ugelCodigo: form.value.ugelCodigo,
    ugelNombre: form.value.ugelNombre,
    tipoGestion: form.value.tipoGestion,
    directorDni: form.value.directorDni,
    directorNombres: form.value.directorNombres,
    directorApellidos: form.value.directorApellidos,
    directorEmail: form.value.directorEmail,
    niveles: form.value.niveles,
    anioEscolar: parseInt(form.value.anioEscolar),
    fechaInicio: form.value.fechaInicio,
    fechaFin: form.value.fechaFin,
    ...(form.value.niveles.includes('INICIAL') && { regimenInicial: form.value.regimenInicial }),
    ...(form.value.niveles.includes('PRIMARIA') && { regimenPrimaria: form.value.regimenPrimaria }),
    ...(form.value.niveles.includes('SECUNDARIA') && { regimenSecundaria: form.value.regimenSecundaria }),
  });
}

function handleCredentialsClose() {
  showCredentialsModal.value = false;
  router.push('/tenants');
}

function planLabel(plan: string): string {
  const map: Record<string, string> = { basico: 'Básico', profesional: 'Profesional', enterprise: 'Enterprise' };
  return map[plan] ?? plan;
}
</script>
