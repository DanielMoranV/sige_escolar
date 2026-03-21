import { ref } from 'vue';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

const toasts = ref<Toast[]>([]);
let _id = 0;

export function useToast() {
  function add(message: string, type: Toast['type'], duration = 3500) {
    const id = ++_id;
    toasts.value.push({ id, message, type });
    setTimeout(() => remove(id), duration);
  }

  function remove(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return {
    toasts,
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    warning: (msg: string) => add(msg, 'warning'),
    remove,
  };
}
