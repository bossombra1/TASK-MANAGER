<template>
  <div class="app">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="brand">
        <div class="brand-mark">T</div>
        <div class="brand-name">Task Manager</div>
      </div>

      <div class="search-box" style="margin: 0 2px 16px;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
        <input v-model="sidebarSearch" placeholder="Rechercher un projet..." />
      </div>

      <nav class="nav-group">
        <span class="label">Espace</span>
        <router-link to="/dashboard" class="nav-item" active-class="active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>
          Tableau de bord
        </router-link>
        <router-link to="/projects" class="nav-item" active-class="active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          Projets
        </router-link>
        <router-link to="/my-tasks" class="nav-item" active-class="active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
          Mes tâches
          <span v-if="myTasksCount" class="count">{{ myTasksCount }}</span>
        </router-link>
        <router-link to="/notifications" class="nav-item" active-class="active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
          Notifications
          <span v-if="unreadNotifCount" class="count">{{ unreadNotifCount }}</span>
        </router-link>
      </nav>

      <nav v-if="sidebarSearch.trim()" class="nav-group">
        <span class="label">Résultats</span>
        <router-link
          v-for="project in searchResults"
          :key="project.id"
          :to="`/projects/${project.id}`"
          class="nav-item"
          active-class="active"
          @click="sidebarSearch = ''"
        >
          <span class="project-dot" :style="{ background: colorFor(project.id) }"></span>
          {{ project.title }}
        </router-link>
        <p v-if="searchResults.length === 0" style="font-size:12px; color:var(--text-3); padding:6px 10px;">
          Aucun projet trouvé.
        </p>
      </nav>

      <nav v-else-if="pinnedProjects.length > 0 || recentProjects.length > 0" class="nav-group">
        <template v-if="pinnedProjects.length > 0">
          <span class="label">Épinglés</span>
          <router-link
            v-for="project in pinnedProjects"
            :key="project.id"
            :to="`/projects/${project.id}`"
            class="nav-item"
            active-class="active"
          >
            <span class="project-dot" :style="{ background: colorFor(project.id) }"></span>
            {{ project.title }}
            <span v-if="projectOverdueCounts[project.id]" class="count danger">{{ projectOverdueCounts[project.id] }}</span>
          </router-link>
        </template>

        <template v-if="recentProjects.length > 0">
          <span class="label" :style="pinnedProjects.length > 0 ? 'margin-top:14px;' : ''">Récents</span>
          <router-link
            v-for="project in recentProjects"
            :key="project.id"
            :to="`/projects/${project.id}`"
            class="nav-item"
            active-class="active"
          >
            <span class="project-dot" :style="{ background: colorFor(project.id) }"></span>
            {{ project.title }}
            <span v-if="projectOverdueCounts[project.id]" class="count danger">{{ projectOverdueCounts[project.id] }}</span>
          </router-link>
        </template>

        <router-link
          v-if="currentProjectId"
          :to="`/projects/${currentProjectId}/members`"
          class="nav-item"
          active-class="active"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          Membres
        </router-link>
        <router-link to="/projects" class="nav-item" style="color:var(--text-3); font-size:12.5px;">
          Voir tous les projets →
        </router-link>
      </nav>

      <nav v-if="auth.isAdmin" class="nav-group">
        <span class="label">Administration</span>
        <router-link to="/admin/users" class="nav-item" active-class="active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          Utilisateurs
        </router-link>
      </nav>

      <router-link to="/profile" class="sidebar-foot" style="text-decoration:none; cursor:pointer;">
        <Avatar :user-id="auth.user?.id" :nom="auth.user?.nom" :avatar-url="auth.user?.avatar_url" :size="34" />
        <div>
          <div class="user-name">{{ auth.user?.nom }}</div>
          <div class="user-role">{{ auth.isAdmin ? 'Administrateur' : 'Membre' }}</div>
        </div>
      </router-link>
    </aside>

    <div class="main">
      <div class="topbar">
        <button class="mobile-toggle" @click="sidebarOpen = !sidebarOpen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <h2>{{ title }}</h2>
        <div class="topbar-actions">
          <button class="icon-btn" @click="handleToggleTheme" title="Changer de thème">
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
      </div>
      <div class="content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import Avatar from '../components/Avatar.vue';
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useProjectsStore } from '../stores/projects';
import { useTasksStore } from '../stores/tasks';
import api from '../services/api';
import { colorFor } from '../utils/colors';
import { getRecentProjects } from '../utils/recentProjects';
import { getPinnedProjects } from '../utils/pinnedProjects';
import { getTheme, toggleTheme } from '../utils/theme';

defineProps({
  title: { type: String, default: '' },
});

const auth = useAuthStore();
const route = useRoute();
const projectsStore = useProjectsStore();
const tasksStore = useTasksStore();

const recentProjectsRaw = ref([]);
const sidebarSearch = ref('');
const unreadNotifCount = ref(0);
const sidebarOpen = ref(false);
const isDark = ref(getTheme() === 'dark');

const currentProjectId = computed(() => route.params.id || null);
const pinnedProjects = computed(() => getPinnedProjects(auth.user?.id));

const recentProjects = computed(() =>
  recentProjectsRaw.value.filter((p) => !pinnedProjects.value.some((pp) => pp.id === p.id))
);

const allProjects = computed(() => projectsStore.projects);
const myTasksCount = computed(() => tasksStore.myTasksCount);

const searchResults = computed(() => {
  const term = sidebarSearch.value.trim().toLowerCase();
  if (!term) return [];
  return allProjects.value.filter((p) => p.title.toLowerCase().includes(term));
});

const projectOverdueCounts = computed(() => {
  const counts = {};
  const now = new Date();
  const combined = [...pinnedProjects.value, ...recentProjectsRaw.value].filter(
    (p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx
  );
  combined.forEach((p) => {
    const tasks = tasksStore.tasksByProject[p.id] || [];
    counts[p.id] = tasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== 'done').length;
  });
  return counts;
});

const handleToggleTheme = () => {
  isDark.value = toggleTheme() === 'dark';
};

const loadSidebarData = async () => {
  recentProjectsRaw.value = getRecentProjects(auth.user?.id);

  await projectsStore.fetchProjects();

  const combined = [...pinnedProjects.value, ...recentProjectsRaw.value].filter(
    (p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx
  );
  await Promise.all(combined.map((p) => tasksStore.fetchTasksByProject(p.id).catch(() => {})));

  await tasksStore.fetchMyTasks();

  try {
    const { data } = await api.get('/notifications');
    unreadNotifCount.value = data.filter((n) => !n.is_read).length;
  } catch (err) {
    console.error(err);
  }
};

onMounted(loadSidebarData);
</script>