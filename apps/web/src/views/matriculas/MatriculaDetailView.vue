<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <button @click="router.back()" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
        <ArrowLeftIcon class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Detalle de Matrícula</h1>
      </div>
    </div>

    <div v-if="isLoading" class="p-12 text-center">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
    </div>

    <div v-else-if="matricula" class="space-y-4">
      <!-- Estudiante -->
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
            {{ matricula.nombres?.[0] }}{{ matricula.apellido_paterno?.[0] }}
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-bold text-gray-900">
              {{ matricula.apellido_paterno }} {{ matricula.apellido_materno }}, {{ matricula.nombres }}
            </h2>
            <p class="text-sm text-gray-500">DNI: {{ matricula.dni }}</p>
          </div>
          <BaseBadge :variant="estadoVariant(matricula.estado)">{{ matricula.estado }}</BaseBadge>
        </div>
      </div>

      <!-- Datos de matrícula -->
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 class="font-semibold text-gray-900 border-b pb-2">Datos de Matrícula</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p class="text-gray-500">Grado y Sección</p>
            <p class="font-medium text-gray-900">{{ matricula.grado_nombre }} - {{ matricula.seccion_nombre }}</p>
          </div>
          <div>
            <p class="text-gray-500">Tipo</p>
            <p class="font-medium text-gray-900">{{ matricula.tipo_matricula }}</p>
          </div>
          <div>
            <p class="text-gray-500">Condición</p>
            <p class="font-medium text-gray-900">{{ matricula.condicion_matricula }}</p>
          </div>
          <div>
            <p class="text-gray-500">F. Matrícula</p>
            <p class="font-medium text-gray-900">{{ formatDate(matricula.fecha_matricula) }}</p>
          </div>
          <div>
            <p class="text-gray-500">F. Inicio</p>
            <p class="font-medium text-gray-900">{{ formatDate(matricula.fecha_inicio) }}</p>
          </div>
          <div v-if="matricula.fecha_retiro">
            <p class="text-gray-500">F. Retiro</p>
            <p class="font-medium text-red-600">{{ formatDate(matricula.fecha_retiro) }}</p>
          </div>
          <div v-if="matricula.ie_procedencia">
            <p class="text-gray-500">I.E. Procedencia</p>
            <p class="font-medium text-gray-900">{{ matricula.ie_procedencia }}</p>
          </div>
          <div v-if="matricula.codigo_modular_procedencia">
            <p class="text-gray-500">Cód. Modular Proc.</p>
            <p class="font-medium text-gray-900">{{ matricula.codigo_modular_procedencia }}</p>
          </div>
        </div>

        <div v-if="matricula.motivo_retiro" class="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          <span class="font-medium">Motivo de retiro:</span> {{ matricula.motivo_retiro }}
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-3">
        <BaseButton
          v-if="matricula.estado === 'ACTIVA'"
          variant="danger"
          @click="showRetiroModal = true"
        >
          <UserMinusIcon class="w-4 h-4" />
          Registrar Retiro
        </BaseButton>
      </div>
    </div>

    <!-- Modal Retiro -->
    <BaseModal :show="showRetiroModal" title="Registrar Retiro de Estudiante" @close="showRetiroModal = false">
      <div class="space-y-4">
        <p class="text-sm text-gray-600 font-medium">
          Estudiante: {{ matricula?.nombres }} {{ matricula?.apellido_paterno }}
        </p>
        <BaseInput v-model="retiroForm.fechaRetiro" type="date" label="Fecha de Retiro" required />
        <BaseInput v-model="retiroForm.motivo" label="Motivo del retiro" placeholder="Ej: Traslado, Motivos personales..." required />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showRetiroModal = false">Cancelar</BaseButton>
          <BaseButton variant="danger" :loading="isRetiring" @click="handleRetiro">Confirmar Retiro</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeftIcon, UserMinusIcon } from 'lucide-vue-next';
import { matriculasService } from '../../api/services/matriculas.service';
import { useToast } from '../../composables/useToast';
import { hoyLima, formatFecha } from '../../utils/date';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import BaseInput from '../../components/ui/BaseInput.vue';

const toast = useToast();
const route = useRoute();
const router = useRouter();

const matriculaId = route.params.id as string;
const isLoading = ref(true);
const matricula = ref<any>(null);
const showRetiroModal = ref(false);
const isRetiring = ref(false);
const retiroForm = ref({ fechaRetiro: hoyLima(), motivo: '' });

onMounted(async () => {
  try {
    matricula.value = await matriculasService.getMatricula(matriculaId);
  } catch {
    toast.error('No se pudo cargar la matrícula');
    router.back();
  } finally {
    isLoading.value = false;
  }
});

async function handleRetiro() {
  if (!retiroForm.value.motivo.trim()) {
    toast.warning('Ingrese el motivo del retiro');
    return;
  }
  isRetiring.value = true;
  try {
    await matriculasService.retirar(matriculaId, retiroForm.value);
    toast.success('Retiro registrado correctamente');
    matricula.value = await matriculasService.getMatricula(matriculaId);
    showRetiroModal.value = false;
  } catch {
    toast.error('Error al registrar el retiro');
  } finally {
    isRetiring.value = false;
  }
}

function estadoVariant(estado: string) {
  if (estado === 'ACTIVA') return 'success';
  if (estado === 'RETIRADA') return 'danger';
  return 'neutral';
}

const formatDate = formatFecha;
</script>
