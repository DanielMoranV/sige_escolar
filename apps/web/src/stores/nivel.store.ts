import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useNivelStore = defineStore('nivel', () => {
  const nivelesDisponibles = ref<string[]>([]);
  const nivelActivo = ref<string>('TODOS');

  const esFiltrable = computed(() => nivelesDisponibles.value.length > 1);

  function init(niveles: string[]) {
    nivelesDisponibles.value = niveles;
    nivelActivo.value = niveles.length === 1 ? niveles[0] : 'TODOS';
  }

  function setNivel(nivel: string) {
    if (esFiltrable.value) nivelActivo.value = nivel;
  }

  return { nivelesDisponibles, nivelActivo, esFiltrable, init, setNivel };
});
