<template>
  <div class="sa-app">
    <aside class="sa-sidebar">
      <div class="sa-brand">
        <div class="sa-brand-mark">S</div>
        <div class="sa-brand-text">
          <div class="sa-brand-name">Super Admin</div>
          <div class="sa-brand-sub">Task Manager</div>
        </div>
      </div>

      <nav class="sa-nav">
        <div class="sa-nav-label">Général</div>
        <router-link to="/super-admin" class="sa-nav-link" exact-active-class="active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
          Tableau de bord
        </router-link>
        <router-link to="/super-admin/organizations" class="sa-nav-link" active-class="active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/></svg>
          Entreprises
        </router-link>
        <router-link to="/super-admin/logs" class="sa-nav-link" active-class="active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3M12 3a9 9 0 100 18 9 9 0 000-18z"/></svg>
          Journal d'activité
        </router-link>

        <router-link to="/super-admin/health" class="sa-nav-link" active-class="active">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  Santé plateforme
</router-link>

      </nav>

      <div class="sa-sidebar-foot">
        <button class="sa-theme-toggle" @click="handleToggleTheme" title="Changer le thème">
          <svg v-if="!isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        </button>

        <div class="sa-user">
          <div class="sa-user-avatar">{{ userInitial }}</div>
          <div class="sa-user-info">
            <div class="sa-user-name">{{ auth.user?.nom }}</div>
            <div class="sa-user-role">Super administrateur</div>
          </div>
        </div>
        <button class="sa-logout" @click="handleLogout">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Déconnexion
        </button>
      </div>
    </aside>

    <div class="sa-main">
      <header class="sa-topbar">
        <h1 class="sa-title">{{ title }}</h1>
        <slot name="actions" />
      </header>
      <div class="sa-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { getTheme, toggleTheme } from '../../utils/theme';

defineProps({
  title: { type: String, default: '' },
});

const auth = useAuthStore();
const router = useRouter();
const isDark = ref(getTheme() === 'dark');

const userInitial = computed(() => (auth.user?.nom || '?').charAt(0).toUpperCase());

const handleToggleTheme = () => {
  isDark.value = toggleTheme() === 'dark';
};

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<style scoped>
.sa-app {
  display: flex;
  min-height: 100vh;
  background: var(--bg, #f7f5f2);
}

/* ---------- SIDEBAR ---------- */
.sa-sidebar {
  width: 250px;
  flex-shrink: 0;
  background: var(--surface, #fff);
  border-right: 1px solid var(--border, #eee);
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  
  /* --- AJOUTS POUR FIXER LA SIDEBAR --- */
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto; 
}

.sa-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 24px;
}

.sa-brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: #1a1a1a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}

.sa-brand-name {
  font-weight: 700;
  font-size: 14.5px;
  color: var(--text, #1a1a1a);
  line-height: 1.2;
}

.sa-brand-sub {
  font-size: 11.5px;
  color: var(--text-3, #999);
}

.sa-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sa-nav-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-3, #999);
  padding: 8px 12px 6px;
}

.sa-nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-2, #555);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.sa-nav-link svg {
  opacity: 0.75;
  flex-shrink: 0;
}

.sa-nav-link:hover {
  background: var(--hover, #f3f1ee);
  color: var(--text, #1a1a1a);
}

.sa-nav-link.active {
  background: var(--accent-soft, #fdece8);
  color: var(--accent, #e8523f);
  font-weight: 600;
}

.sa-nav-link.active svg {
  opacity: 1;
}

/* ---------- SIDEBAR FOOT ---------- */
.sa-sidebar-foot {
  border-top: 1px solid var(--border, #eee);
  padding-top: 14px;
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sa-theme-toggle {
  align-self: flex-start;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border, #eee);
  background: var(--surface, #fff);
  color: var(--text-2, #555);
  cursor: pointer;
}

.sa-theme-toggle:hover {
  background: var(--hover, #f3f1ee);
}

.sa-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
}

.sa-user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--accent, #e8523f);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.sa-user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #1a1a1a);
  line-height: 1.3;
}

.sa-user-role {
  font-size: 11.5px;
  color: var(--text-3, #999);
}

.sa-logout {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--danger, #d9463a);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}

.sa-logout:hover {
  background: var(--danger-soft, #fdeceb);
}

/* ---------- MAIN ---------- */
.sa-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sa-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 32px;
  border-bottom: 1px solid var(--border, #eee);
  background: var(--surface, #fff);
}

.sa-title {
  font-size: 19px;
  font-weight: 700;
  color: var(--text, #1a1a1a);
  margin: 0;
}

.sa-content {
  flex: 1;
  padding: 28px 32px;
  overflow-y: visible;
}

@media (max-width: 900px) {
  .sa-sidebar { width: 210px; }
  .sa-content, .sa-topbar { padding: 20px; }
}
</style>