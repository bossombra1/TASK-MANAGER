<template>
  <AppLayout title="Vos projets">
    <div class="page-head">
      <div>
        <h1>Vos projets</h1>
        <p>{{ projects.length }} projet{{ projects.length > 1 ? 's' : '' }} actif{{ projects.length > 1 ? 's' : '' }}</p>
      </div>
      <button v-if="auth.isAdmin" class="btn btn-primary btn-add" style="width:auto" @click="showNewProjectModal = true">
        + Nouveau projet
      </button>
    </div>

    <p v-if="loading" style="color:var(--text-2); font-size:13px;">Chargement...</p>
    <p v-else-if="projects.length === 0" style="color:var(--text-2); font-size:13px;">
      Aucun projet pour le moment.
    </p>

    <div v-else class="grid-projects">
      <router-link
        v-for="project in projects"
        :key="project.id"
        :to="`/projects/${project.id}`"
        class="project-card"
      >
        <div class="top-row">
          <div class="project-icon" :style="{ background: project.color || colorFor(project.id) }">
            {{ project.title.charAt(0).toUpperCase() }}
          </div>
        </div>
        <h3>{{ project.title }}</h3>
        <div class="desc">{{ project.description || 'Pas de description' }}</div>
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: progressPercent(project) + '%', background: project.color || colorFor(project.id) }"
          ></div>
        </div>
        <div class="card-foot">
          <div class="avatar-stack">
            <Avatar
              v-for="member in (project.members || []).slice(0, 3)"
              :key="member.id"
              :user-id="member.id"
              :nom="member.nom"
              :avatar-url="member.avatar_url"
              :size="30"
            />
          </div>
          <span class="task-count">{{ doneCount(project) }}/{{ (project.tasks || []).length }} tâches</span>
        </div>
      </router-link>
    </div>

    <NewProjectModal
      v-if="showNewProjectModal"
      @close="showNewProjectModal = false"
      @created="handleProjectCreated"
    />
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../components/AppLayout.vue';
import NewProjectModal from '../components/NewProjectModal.vue';
import Avatar from '../components/Avatar.vue';
import { useAuthStore } from '../stores/auth';
import { useProjectsStore } from '../stores/projects';
import { useTasksStore } from '../stores/tasks';
import { colorFor } from '../utils/colors';

const auth = useAuthStore();
const projectsStore = useProjectsStore();
const tasksStore = useTasksStore();
const loading = ref(true);
const showNewProjectModal = ref(false);

const projects = computed(() =>
  projectsStore.projects.map((p) => ({
    ...p,
    members: projectsStore.details[p.id]?.members || [],
    tasks: tasksStore.tasksByProject[p.id] || [],
  }))
);

const doneCount = (project) => (project.tasks || []).filter((t) => t.status === 'done').length;
const progressPercent = (project) => {
  const total = (project.tasks || []).length;
  if (!total) return 0;
  return Math.round((doneCount(project) / total) * 100);
};

const fetchProjects = async (force = false) => {
  loading.value = true;
  try {
    await projectsStore.fetchProjects(force);
    await Promise.all(
      projectsStore.projects.map((p) =>
        Promise.all([
          projectsStore.fetchProjectDetail(p.id, force).catch(() => {}),
          tasksStore.fetchTasksByProject(p.id, force).catch(() => {}),
        ])
      )
    );
  } finally {
    loading.value = false;
  }
};

const handleProjectCreated = () => {
  fetchProjects(false);
};

onMounted(() => fetchProjects());
</script>