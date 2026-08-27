<template>
  <header class="topbar">
    <button class="mobile-toggle" @click="$emit('toggleSidebar')" aria-label="Basculer la barre latérale">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
    <h2>{{ title }}</h2>
    <div class="topbar-actions">
      <button class="icon-btn" @click="$emit('toggleTheme')" title="Changer de thème">
        <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      </button>
      <router-link to="/notifications" class="icon-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
        <span v-if="unreadNotifCount" class="dot"></span>
      </router-link>
      <router-link to="/profile">
        <Avatar :user-id="auth.user?.id" :nom="auth.user?.nom" :avatar-url="auth.user?.avatar_url" :size="34" />
      </router-link>
    </div>
  </header>
</template>

<script setup>
import Avatar from '../atoms/Avatar.vue';

const props = defineProps({
  title: { type: String, default: '' },
  isDark: { type: Boolean, default: false },
  unreadNotifCount: { type: Number, default: 0 },
  auth: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['toggleTheme', 'toggleSidebar']);
</script>
