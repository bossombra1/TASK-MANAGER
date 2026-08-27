<template>
  <Teleport to="body">
    <div class="toast-stack">
      <TransitionGroup name="toast-fade">
        <div v-for="toast in toastStore.toasts" :key="toast.id" class="toast" :class="toast.type">
          <svg v-if="toast.type === 'warning'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
          <span>{{ toast.message }}</span>
          <button class="toast-close" @click="toastStore.dismiss(toast.id)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '../../stores/toast';

const toastStore = useToastStore();
</script>

<style scoped>
.toast-stack {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 300;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  font-size: 13px;
  max-width: 340px;
  color: var(--text, #1a1a1a);
}

.toast.warning {
  border-left: 3px solid #e0a62e;
}

.toast.warning svg {
  color: #e0a62e;
  flex-shrink: 0;
}

.toast-close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-3, #999);
  flex-shrink: 0;
  padding: 2px;
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>