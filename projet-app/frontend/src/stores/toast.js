import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([]);

  function success(message, duration = 3000) {
    add(message, 'success', duration);
  }

  function error(message, duration = 5000) {
    add(message, 'error', duration);
  }

  function info(message, duration = 3000) {
    add(message, 'info', duration);
  }

  function add(message, type = 'info', duration = 3000) {
    const id = Date.now();
    toasts.value.push({ id, message, type });
    setTimeout(() => {
      remove(id);
    }, duration);
  }

  function remove(id) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return { toasts, success, error, info, remove };
});
