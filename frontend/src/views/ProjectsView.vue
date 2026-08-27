<template>
  <AppLayout title="Vos projets">
    <div class="page-head enhanced-head">
      <div>
        <h1>Vos projets</h1>
        <p v-if="!loading">{{ projects.length }} projet{{ projects.length > 1 ? 's' : '' }} actif{{ projects.length > 1 ? 's' : '' }}</p>
        <p v-else>Chargement de vos projets...</p>
      </div>
      <Button v-if="auth.isAdmin" class="btn btn-primary btn-add" style="width:auto" @click="showNewProjectModal = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouveau projet
      </Button>
    </div>

    <!-- État de chargement (Skeletons) -->
    <div v-if="loading" class="grid-projects">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <div class="sk-top">
          <div class="sk-icon"></div>
          <div class="sk-lines">
            <div class="sk-line w-60"></div>
            <div class="sk-line w-40"></div>
          </div>
        </div>
        <div class="sk-desc"></div>
        <div class="sk-desc w-80"></div>
        <div class="sk-progress"></div>
        <div class="sk-foot">
          <div class="sk-avatars"></div>
          <div class="sk-count"></div>
        </div>
      </div>
    </div>

    <!-- État vide (Empty State) -->
    <div v-else-if="projects.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      </div>
      <h3>Aucun projet pour le moment</h3>
      <p>Commencez par créer votre premier projet pour organiser vos tâches et collaborer avec votre équipe.</p>
      <Button v-if="auth.isAdmin" class="btn btn-primary btn-add" style="width:auto" @click="showNewProjectModal = true">
        + Créer mon premier projet
      </Button>
    </div>

    <!-- Liste des projets -->
    <TransitionGroup v-else name="card-list" tag="div" class="grid-projects">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        :progress-percent="progressPercent(project)"
        :done-count="doneCount(project)"
      />
    </TransitionGroup>

    <NewProjectModal
      v-if="showNewProjectModal"
      @close="showNewProjectModal = false"
      @created="handleProjectCreated"
    />
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../components/templates/AppLayout.vue';
import NewProjectModal from '../components/organisms/NewProjectModal.vue';
import ProjectCard from '../components/molecules/ProjectCard.vue';
import Button from '../components/atoms/Button.vue';
import { useAuthStore } from '../stores/auth';
import { useProjectsStore } from '../stores/projects';
import { useTasksStore } from '../stores/tasks';

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

<style scoped>
/* --- En-tête de page --- */
.enhanced-head {
  margin-bottom: 32px;
}

.enhanced-head h1 {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.enhanced-head p {
  font-size: 14px;
  color: var(--text-2);
}

.enhanced-head .btn-add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px !important;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(232, 82, 63, 0.2);
  transition: all 0.2s ease;
}

.enhanced-head .btn-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(232, 82, 63, 0.3);
}

/* --- Squelettes de chargement (Loading) --- */
.skeleton-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px;
  height: 220px; /* Hauteur fixe pour matcher les vraies cartes */
  display: flex;
  flex-direction: column;
}

.sk-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.sk-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--surface-2);
}

.sk-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sk-line {
  height: 10px;
  border-radius: 4px;
  background: var(--surface-2);
}

.sk-desc {
  height: 10px;
  border-radius: 4px;
  background: var(--surface-2);
  margin-bottom: 8px;
}

.sk-progress {
  height: 6px;
  border-radius: 4px;
  background: var(--surface-2);
  margin-top: auto;
  margin-bottom: 12px;
}

.sk-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sk-avatars {
  width: 60px;
  height: 24px;
  border-radius: 12px;
  background: var(--surface-2);
}

.sk-count {
  width: 40px;
  height: 12px;
  border-radius: 4px;
  background: var(--surface-2);
}

/* Effet de brillance (shimmer) pour les skeletons */
.skeleton-card > * {
  position: relative;
  overflow: hidden;
}

.skeleton-card > *::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 2.5s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

/* Largeurs arbitraires pour le réalisme */
.w-60 { width: 60%; }
.w-40 { width: 40%; }
.w-80 { width: 80%; }

/* --- État vide (Empty State) --- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  margin-top: 20px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--accent-soft);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-1);
}

.empty-state p {
  font-size: 14px;
  color: var(--text-2);
  max-width: 400px;
  line-height: 1.5;
  margin-bottom: 24px;
}

/* --- Animations d'apparition des cartes --- */
.card-list-enter-active {
  transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-list-leave-active {
  transition: all 0.9s ease;
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.card-list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Pour un effet cascade, on peut retarder chaque carte */
.card-list-move {
  transition: transform 0.8s ease;
}
</style>