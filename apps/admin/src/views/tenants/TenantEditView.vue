<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <RouterLink :to="`/tenants/${tenantId}`" class="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
        <ArrowLeftIcon class="w-5 h-5" />
      </RouterLink>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Editar colegio</h1>
        <p v-if="tenant" class="text-gray-500 mt-0.5 text-sm font-mono">{{ tenant.slug }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isPending" class="bg-white rounded-xl border border-gray-200 p-8 flex justify-center">
      <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else-if="tenant">
      <!-- Sección: Datos básicos -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <p class="text-sm font-semibold text-gray-700">Datos básicos</p>
        </div>
        <div class="p-4 space-y-4">
          <BaseInput v-model="form.nombre" label="Nombre del colegio" required :error="errors.nombre" />
          <div>
            <p class="text-sm font-medium text-gray-700 mb-2">Plan</p>
            <div class="grid grid-cols-3 gap-3">
              <label v-for="plan in plans" :key="plan.value" :class="[
                'cursor-pointer rounded-xl border-2 p-3 transition-colors',
                form.plan === plan.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
              ]">
                <input type="radio" v-model="form.plan" :value="plan.value" class="sr-only" />
                <p class="font-semibold text-gray-900 text-sm">{{ plan.label }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ plan.desc }}</p>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección: Datos MINEDU -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <p class="text-sm font-semibold text-gray-700">Datos MINEDU</p>
        </div>
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model="form.codigoModular" label="Código Modular (7 dígitos)" :error="errors.codigoModular" />
            <div>
              <p class="text-sm font-medium text-gray-700 mb-1">Tipo de gestión</p>
              <div class="flex gap-2 flex-wrap">
                <label v-for="tipo in tiposGestion" :key="tipo.value" :class="[
                  'cursor-pointer rounded-lg border-2 px-3 py-1.5 text-sm transition-colors',
                  form.tipoGestion === tipo.value ? 'border-blue-500 bg-blue-50 font-medium text-blue-700' : 'border-gray-200',
                ]">
                  <input type="radio" v-model="form.tipoGestion" :value="tipo.value" class="sr-only" />
                  {{ tipo.label }}
                </label>
              </div>
            </div>
          </div>
          <BaseInput v-model="form.nombreOficial" label="Nombre oficial de la IE" :error="errors.nombreOficial" />
          <div class="grid grid-cols-2 gap-4">
            <BaseSelect v-model="form.dreCodigo" label="DRE" :options="dreOptions" @update:modelValue="onDreChange" />
            <BaseInput v-model="form.ugelCodigo" label="UGEL (código)" />
          </div>
          <BaseInput v-model="form.ugelNombre" label="UGEL (nombre)" />
        </div>
      </div>

      <!-- Sección: Año Escolar -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <p class="text-sm font-semibold text-gray-700">Año escolar activo</p>
        </div>
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">Año</label>
              <input
                type="number"
                v-model.number="form.anioEscolar"
                min="2020"
                max="2099"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">Fecha de inicio</label>
              <input
                type="date"
                v-model="form.fechaInicio"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">Fecha de fin</label>
              <input
                type="date"
                v-model="form.fechaFin"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p class="text-xs text-gray-400">
            Si el colegio no tiene un año escolar configurado se creará automáticamente con estos valores.
          </p>
        </div>
      </div>

      <!-- Sección: Niveles y régimen -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <p class="text-sm font-semibold text-gray-700">Niveles educativos y régimen (año escolar activo)</p>
        </div>
        <div class="p-4 space-y-4">
          <!-- Checkboxes de niveles -->
          <div>
            <p class="text-sm font-medium text-gray-700 mb-2">Niveles que ofrece el colegio</p>
            <div class="grid grid-cols-3 gap-3">
              <label v-for="n in nivelesOpciones" :key="n.value" :class="[
                'cursor-pointer rounded-xl border-2 p-3 transition-colors',
                form.nivelesSeleccionados.includes(n.value)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300',
              ]">
                <input type="checkbox" :value="n.value" v-model="form.nivelesSeleccionados" class="sr-only" />
                <p class="font-semibold text-gray-900 text-sm">{{ n.label }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ n.desc }}</p>
              </label>
            </div>
          </div>

          <!-- Régimen por nivel seleccionado -->
          <template v-for="nivel in form.nivelesSeleccionados" :key="nivel">
            <div class="p-3 rounded-xl border border-gray-200 space-y-2">
              <p class="text-sm font-medium text-gray-700">{{ nivel }}</p>
              <div class="flex flex-wrap gap-2">
                <label v-for="r in regimenes" :key="`${nivel}-${r.value}`" :class="[
                  'cursor-pointer rounded-lg border-2 px-3 py-1.5 text-sm transition-colors',
                  form.regimenes[nivel] === r.value
                    ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
                    : 'border-gray-200 hover:border-gray-300',
                ]">
                  <input type="radio" :name="`regimen-${nivel}`" :value="r.value"
                    v-model="form.regimenes[nivel]" class="sr-only" />
                  {{ r.label }}
                </label>
              </div>
            </div>
          </template>

          <p v-if="form.nivelesSeleccionados.length === 0" class="text-sm text-gray-400 text-center py-2">
            Seleccione al menos un nivel para configurar el régimen.
          </p>
        </div>
      </div>

      <!-- Sección: Director -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <p class="text-sm font-semibold text-gray-700">Director</p>
        </div>
        <div class="p-4 space-y-4">
          <BaseInput v-model="form.directorDni" label="DNI (8 dígitos)" :error="errors.directorDni" />
          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model="form.directorNombres" label="Nombres" />
            <BaseInput v-model="form.directorApellidos" label="Apellidos" />
          </div>
        </div>
      </div>

      <!-- Error general -->
      <div v-if="updateMutation.isError.value" class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        Error al guardar los cambios. Verifique los datos e intente nuevamente.
      </div>

      <!-- Acciones -->
      <div class="flex items-center justify-between">
        <RouterLink :to="`/tenants/${tenantId}`">
          <BaseButton variant="secondary">Cancelar</BaseButton>
        </RouterLink>
        <BaseButton :loading="updateMutation.isPending.value" @click="save">
          <SaveIcon class="w-4 h-4" />
          Guardar cambios
        </BaseButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { ArrowLeftIcon, SaveIcon } from 'lucide-vue-next';
import { tenantsService } from '../../api/services/tenants.service';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const tenantId = route.params.id as string;

const { data: tenant, isPending } = useQuery({
  queryKey: ['tenant', tenantId],
  queryFn: () => tenantsService.getTenant(tenantId),
});

const currentYear = new Date().getFullYear();

const form = ref({
  nombre: '',
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
  nivelesSeleccionados: [] as string[],
  regimenes: {} as Record<string, string>,
  // Año escolar
  anioEscolar: currentYear,
  fechaInicio: `${currentYear}-03-01`,
  fechaFin: `${currentYear}-12-20`,
});

const errors = ref<Record<string, string>>({});

const nivelesOpciones = [
  { value: 'INICIAL', label: 'Inicial', desc: '3 a 5 años' },
  { value: 'PRIMARIA', label: 'Primaria', desc: '1° a 6° grado' },
  { value: 'SECUNDARIA', label: 'Secundaria', desc: '1° a 5° año' },
];

// Populate form once tenant data is loaded
watch(tenant, (t) => {
  if (!t) return;

  const rc: Array<{ nivel: string; tipo_regimen: string }> = t.regimen_config ?? [];
  const regimenMap: Record<string, string> = {};
  for (const entry of rc) {
    regimenMap[entry.nivel] = entry.tipo_regimen;
  }

  // Load school year from API or use current-year defaults
  const anio = t.anio_escolar_config?.anio ?? currentYear;

  form.value = {
    nombre: t.nombre ?? '',
    plan: t.plan ?? 'basico',
    codigoModular: t.datos_minedu?.codigo_modular ?? '',
    nombreOficial: t.datos_minedu?.nombre_oficial ?? '',
    dreCodigo: t.datos_minedu?.dre_codigo ?? '',
    dreNombre: t.datos_minedu?.dre_nombre ?? '',
    ugelCodigo: t.datos_minedu?.ugel_codigo ?? '',
    ugelNombre: t.datos_minedu?.ugel_nombre ?? '',
    tipoGestion: t.datos_minedu?.tipo_gestion ?? 'PRIVADA',
    directorDni: t.datos_minedu?.director_dni ?? '',
    directorNombres: t.datos_minedu?.director_nombres ?? '',
    directorApellidos: t.datos_minedu?.director_apellidos ?? '',
    nivelesSeleccionados: rc.map((r) => r.nivel),
    regimenes: regimenMap,
    anioEscolar: anio,
    fechaInicio: t.anio_escolar_config?.fecha_inicio ?? `${anio}-03-01`,
    fechaFin: t.anio_escolar_config?.fecha_fin ?? `${anio}-12-20`,
  };
}, { immediate: true });

const plans = [
  { value: 'basico', label: 'Básico', desc: 'Hasta 500 estudiantes' },
  { value: 'profesional', label: 'Profesional', desc: 'Hasta 1500 estudiantes' },
  { value: 'enterprise', label: 'Enterprise', desc: 'Sin límite' },
];

const tiposGestion = [
  { value: 'PRIVADA', label: 'Privada' },
  { value: 'PUBLICA', label: 'Pública' },
  { value: 'CONVENIO', label: 'Convenio' },
];

const regimenes = [
  { value: 'BIMESTRAL', label: 'Bimestral (4 periodos)' },
  { value: 'TRIMESTRAL', label: 'Trimestral (3 periodos)' },
  { value: 'SEMESTRAL', label: 'Semestral (2 periodos)' },
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

const dreOptions = [
  { value: '', label: 'Seleccionar DRE...' },
  ...DRES.map((d) => ({ value: d.codigo, label: d.nombre })),
];

function onDreChange(codigo: string) {
  const dre = DRES.find((d) => d.codigo === codigo);
  form.value.dreNombre = dre?.nombre ?? '';
}

function validate(): boolean {
  const e: Record<string, string> = {};
  if (!form.value.nombre.trim() || form.value.nombre.length < 3)
    e.nombre = 'El nombre debe tener al menos 3 caracteres';
  if (form.value.codigoModular && !/^\d{7}$/.test(form.value.codigoModular))
    e.codigoModular = 'Debe tener exactamente 7 dígitos';
  if (form.value.directorDni && !/^\d{8}$/.test(form.value.directorDni))
    e.directorDni = 'Debe tener exactamente 8 dígitos';
  errors.value = e;
  return Object.keys(e).length === 0;
}

const updateMutation = useMutation({
  mutationFn: (payload: Record<string, unknown>) => tenantsService.updateTenant(tenantId, payload),
  onSuccess: (response) => {
    console.log('[TenantEdit] Respuesta del API (éxito):', response);
    queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    router.push(`/tenants/${tenantId}`);
  },
  onError: (error: any) => {
    console.error('[TenantEdit] Error al guardar:', error?.response?.data ?? error);
  },
});

function save() {
  if (!validate()) return;
  const { regimenes, nivelesSeleccionados, anioEscolar, fechaInicio, fechaFin, ...rest } = form.value;

  const payload = Object.assign({}, rest, {
    niveles: nivelesSeleccionados,
    regimenPrimaria: regimenes['PRIMARIA'],
    regimenSecundaria: regimenes['SECUNDARIA'],
    regimenInicial: regimenes['INICIAL'],
    anioEscolar,
    fechaInicio,
    fechaFin,
  });

  console.log('[TenantEdit] Guardando payload:', payload);

  updateMutation.mutate(payload);
}
</script>
