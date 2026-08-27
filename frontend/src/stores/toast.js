import { defineStore } from 'pinia';

let nextId = 1;

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [], // [{ id, message, type }]
  }),

  actions: {
    show(message, type = 'warning', duration = 9000) {
      const id = nextId++;
      this.toasts.push({ id, message, type });
      setTimeout(() => this.dismiss(id), duration);
    },

    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },
  },
});