<template>
  <div class="app">
    <Sidebar
      :search-value="sidebarSearch"
      :sidebar-open="sidebarOpen"
      :pinned-projects="pinnedProjects"
      :recent-projects="recentProjects"
      :search-results="searchResults"
      :current-project-id="currentProjectId"
      :project-overdue-counts="projectOverdueCounts"
      :my-tasks-count="myTasksCount"
      :unread-notif-count="unreadNotifCount"
      :auth="auth"
      @update:searchValue="(value) => (sidebarSearch = value)"
      @update:sidebarOpen="(value) => (sidebarOpen = value)"
    />

    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>

    <div class="main">
      <Topbar
        :title="title"
        :is-dark="isDark"
        :unread-notif-count="unreadNotifCount"
        :auth="auth"
        @toggle-theme="handleToggleTheme"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
      />
      <div class="content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useProjectsStore } from '../../stores/projects';
import { useTasksStore } from '../../stores/tasks';
import api from '../../services/api';
import Sidebar from '../organisms/Sidebar.vue';
import Topbar from '../organisms/Topbar.vue';
import { getRecentProjects } from '../../utils/recentProjects';
import { getPinnedProjects } from '../../utils/pinnedProjects';
import { getTheme, toggleTheme } from '../../utils/theme';

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