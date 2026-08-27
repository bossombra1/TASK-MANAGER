import { defineStore } from 'pinia';

export const usePlanLimitStore = defineStore('planLimit', {
  state: () => ({
    visible: false,
    message: '',
  }),

  actions: {
    show(message) {
      this.message = message;
      this.visible = true;
    },
    close() {
      this.visible = false;
    },
  },
});