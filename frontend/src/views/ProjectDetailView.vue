<template>
  <AppLayout :title="project?.title || 'Projet'">
    
    <!-- État de chargement (Skeleton) -->
    <div v-if="loading" class="skeleton-wrapper">
      <div class="sk-head">
        <div class="sk-title-row">
          <div class="sk-color-dot"></div>
          <div class="sk-title"></div>
        </div>
        <div class="sk-actions">
          <div class="sk-btn w-80"></div>
          <div class="sk-btn w-100"></div>
        </div>
      </div>
      <div class="sk-desc"></div>
      <div class="sk-avatars">
        <div class="sk-avatar" v-for="i in 4" :key="i"></div>
      </div>
      <div class="sk-toolbar"></div>
      <div class="sk-board">
        <div class="sk-col" v-for="i in 3" :key="i">
          <div class="sk-card" v-for="j in 2" :key="j"></div>
        </div>
      </div>
    </div>

    <!-- État d'erreur (Projet introuvable) -->
    <div v-else-if="!project" class="empty-state error-state">
      <div class="empty-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
      </div>
      <h3>Projet introuvable</h3>
      <p>Ce projet n'existe plus ou a été supprimé.</p>
      <Button class="btn btn-primary" style="width:auto;" @click="router.push('/projects')">Retour aux projets</Button>
    </div>

    <!-- Contenu du projet -->
    <template v-else-if="project">
      <div class="page-head enhanced-head project-head">
        <div class="project-head-info">
          <div class="title-row">
            <div class="project-color-dot" :style="{ background: project.color || 'var(--accent)' }"></div>
            <h1>{{ project.title }}</h1>
          </div>
          <p class="project-desc" :title="project.description || ''">
            {{ project.description || 'Aucune description fournie pour ce projet.' }}
          </p>
        </div>
        
        <div class="page-actions">
          <div class="view-toggle">
            <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">Liste</button>
            <button :class="{ active: viewMode === 'kanban' }" @click="viewMode = 'kanban'">Kanban</button>
          </div>
          
          <div class="action-divider"></div>
          
          <button class="icon-btn enhanced-icon-btn" :title="pinned ? 'Retirer des favoris' : 'Épingler ce projet'" @click="handleTogglePin">
            <svg v-if="pinned" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:var(--accent);"><path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5 2.3-7.2-6-4.6h7.6z"/></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5 2.3-7.2-6-4.6h7.6z"/></svg>
          </button>
          
          <Button v-if="auth.isAdmin" class="btn btn-primary btn-add" style="width:auto;" @click="showNewTaskModal = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvelle tâche
          </Button>
          
          <button v-if="auth.isAdmin" class="icon-btn enhanced-icon-btn" title="Modifier le projet" @click="showEditProjectModal = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          
          <button v-if="auth.isAdmin" class="icon-btn enhanced-icon-btn danger-btn" title="Supprimer le projet" @click="handleDeleteProject">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <!-- Membres -->
      <div class="member-section">
        <div class="avatar-stack enhanced-stack">
          <Avatar
            v-for="member in (project.members || []).slice(0, 5)"
            :key="member.id"
            :user-id="member.id"
            :nom="member.nom"
            :avatar-url="member.avatar_url"
            :size="32"
            :title="member.nom"
          />
        </div>
        <span v-if="(project.members || []).length > 5" class="more-members">
          +{{ (project.members || []).length - 5 }}
        </span>
      </div>

      <!-- Barre de filtres -->
      <TaskToolbar
        :status="filters.status"
        :assignee="filters.assignee"
        :keyword="filters.keyword"
        :assignees="project.members || []"
        @update:status="(value) => (filters.status = value)"
        @update:assignee="(value) => (filters.assignee = value)"
        @update:keyword="(value) => (filters.keyword = value)"
      />

      <!-- État vide : Aucune tâche -->
      <div v-if="tasks.length === 0" class="empty-state subtle">
        <div class="empty-icon small">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        </div>
        <h3>Aucune tâche pour le moment</h3>
        <p>Ce projet est vide. Commencez par créer votre première tâche.</p>
        <Button v-if="auth.isAdmin" class="btn btn-primary" style="width:auto;" @click="showNewTaskModal = true">
          + Nouvelle tâche
        </Button>
      </div>

      <!-- État vide : Filtres sans résultat -->
      <div v-else-if="filteredTasks.length === 0" class="empty-state subtle">
        <div class="empty-icon small">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <h3>Aucun résultat</h3>
        <p>Aucune tâche ne correspond à vos critères de recherche.</p>
      </div>

      <!-- ===== VUE LISTE ===== -->
      <TaskTable
        v-else-if="viewMode === 'list'"
        :tasks="filteredTasks"
        variant="project"
        :show-project="false"
        :is-overdue="isOverdue"
        @open="openTask"
        @update-status="changeStatus"
      />

      <!-- ===== VUE KANBAN ===== -->
      <KanbanBoard
        v-else-if="viewMode === 'kanban'"
        :columns="columns"
        :tasks="filteredTasks"
        :show-project-title="false"
        :status-badge="statusBadge"
        :priority-badge="priorityBadge"
        :priority-label="priorityLabel"
        :format-date="formatDate"
        :is-overdue="isOverdue"
        @open-task="openTask"
        @change-status="changeStatus"
      />

      <!-- Modales -->
      <NewTaskModal
        v-if="showNewTaskModal"
        :project-id="route.params.id"
        :members="project.members || []"
        @close="showNewTaskModal = false"
        @created="handleTaskCreated"
      />
      <EditProjectModal
        v-if="showEditProjectModal"
        :project="project"
        @close="showEditProjectModal = false"
        @updated="handleProjectUpdated"
      />
    </template>
  </AppLayout>
</template>

<script setup>
import EditProjectModal from '../components/organisms/EditProjectModal.vue';
import { pushRecentProject, removeRecentProject } from '../utils/recentProjects';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/templates/AppLayout.vue';
import NewTaskModal from '../components/organisms/NewTaskModal.vue';
import Avatar from '../components/atoms/Avatar.vue';
import Button from '../components/atoms/Button.vue';
import TaskToolbar from '../components/organisms/TaskToolbar.vue';
import TaskTable from '../components/organisms/TaskTable.vue';
import KanbanBoard from '../components/organisms/KanbanBoard.vue';
import { useAuthStore } from '../stores/auth';
import { useProjectsStore } from '../stores/projects';
import { useTasksStore } from '../stores/tasks';
import { isPinned, togglePin } from '../utils/pinnedProjects';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const projectsStore = useProjectsStore();
const tasksStore = useTasksStore();

const showEditProjectModal = ref(false);
const loading = ref(true);
const viewMode = ref('kanban');
const showNewTaskModal = ref(false);
const filters = ref({ status: '', assignee: '', keyword: '' });

const projectId = computed(() => route.params.id);
const project = computed(() => projectsStore.details[projectId.value] || null);
const tasks = computed(() => tasksStore.tasksByProject[projectId.value] || []);

const pinned = computed(() => project.value && isPinned(auth.user?.id, project.value.id));

const handleTogglePin = () => {
  if (!project.value) return;
  togglePin(auth.user?.id, { id: project.value.id, title: project.value.title });
};

const columns = [
  { status: 'todo', label: 'À faire' },
  { status: 'doing', label: 'En cours' },
  { status: 'done', label: 'Terminé' },
];

const statusBadge = (status) => ({ todo: 'badge-todo', doing: 'badge-progress', done: 'badge-done' }[status] || 'badge-todo');
const priorityBadge = (priority) => ({ low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }[priority] || 'badge-low');
const priorityLabel = (priority) => ({ low: 'Basse', medium: 'Moyenne', high: 'Haute' }[priority] || priority);
const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
const isOverdue = (task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

const filteredTasks = computed(() => {
  return tasks.value.filter((t) => {
    if (filters.value.status && t.status !== filters.value.status) return false;
    if (filters.value.assignee && !(t.assignees || []).some((a) => a.id === filters.value.assignee)) return false;
    if (filters.value.keyword) {
      const kw = filters.value.keyword.toLowerCase();
      const inTitle = t.title.toLowerCase().includes(kw);
      const inDesc = (t.description || '').toLowerCase().includes(kw);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });
});

const openTask = (task) => {
  router.push(`/projects/${projectId.value}/tasks/${task.id}`);
};

const handleTaskCreated = () => {};

const handleProjectUpdated = () => {};

const handleDeleteProject = async () => {
  if (!confirm('Supprimer définitivement ce projet et toutes ses tâches ?')) return;
  try {
    await projectsStore.deleteProject(projectId.value);
    removeRecentProject(auth.user?.id, projectId.value);
    router.push('/projects');
  } catch (err) {
    console.error(err);
    alert('Erreur lors de la suppression du projet');
  }
};

const changeStatus = async (task, newStatus) => {
  try {
    await tasksStore.updateTaskStatus(task.id, newStatus);
  } catch (err) {
    console.error(err);
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    await projectsStore.fetchProjectDetail(projectId.value, true);
    await tasksStore.fetchTasksByProject(projectId.value, true);
    if (project.value) {
      pushRecentProject(auth.user?.id, { id: project.value.id, title: project.value.title });
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
/* --- En-tête --- */
.enhanced-head {
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 20px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px var(--surface), 0 0 0 4px var(--border);
}

.enhanced-head h1 {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}

.project-desc {
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.5;
  max-width: 600px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: 4px;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.action-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 4px;
}

.enhanced-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-2);
  transition: all 0.2s ease;
}

.enhanced-icon-btn:hover {
  border-color: var(--text-3);
  color: var(--text-1);
  background: var(--surface-2);
}

.enhanced-icon-btn.danger-btn:hover {
  background: var(--danger-soft);
  border-color: var(--danger);
  color: var(--danger);
}

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px !important;
  font-size: 13.5px;
  box-shadow: 0 4px 12px rgba(232, 82, 63, 0.15);
}

/* --- Section Membres --- */
.member-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.enhanced-stack .avatar {
  border: 2px solid var(--surface);
  transition: transform 0.2s ease;
  cursor: pointer;
}

.enhanced-stack .avatar:hover {
  transform: translateY(-3px);
  z-index: 10;
}

.more-members {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-2);
  background: var(--surface-2);
  padding: 6px 10px;
  border-radius: 20px;
}

/* --- Skeletons --- */
.skeleton-wrapper {
  padding-top: 10px;
}

.sk-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.sk-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sk-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: var(--surface-2);
}

.sk-title {
  width: 180px;
  height: 24px;
  border-radius: 4px;
  background: var(--surface-2);
}

.sk-actions {
  display: flex;
  gap: 10px;
}

.sk-btn {
  height: 36px;
  border-radius: 8px;
  background: var(--surface-2);
}

.w-80 { width: 80px; }
.w-100 { width: 120px; }

.sk-desc {
  width: 300px;
  height: 14px;
  border-radius: 4px;
  background: var(--surface-2);
  margin-bottom: 24px;
}

.sk-avatars {
  display: flex;
  gap: -8px;
  margin-bottom: 24px;
}

.sk-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 2px solid var(--surface);
  margin-left: -8px;
}

.sk-avatar:first-child {
  margin-left: 0;
}

.sk-toolbar {
  height: 40px;
  border-radius: 8px;
  background: var(--surface-2);
  margin-bottom: 24px;
}

.sk-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.sk-col {
  background: var(--surface-2);
  border-radius: 10px;
  padding: 12px;
  min-height: 200px;
}

.sk-card {
  height: 60px;
  background: var(--surface);
  border-radius: 6px;
  margin-bottom: 10px;
}

/* Animation de brillance (Shimmer) */
.skeleton-wrapper > * {
  position: relative;
  overflow: hidden;
}

.skeleton-wrapper > *::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}

/* --- Empty States --- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  margin-top: 10px;
}

.empty-state.subtle {
  border: 1px solid var(--border);
  padding: 40px 20px;
}

.empty-state.error-state {
  min-height: 50vh;
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

.empty-icon.small {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.empty-state.error-state .empty-icon {
  background: var(--danger-soft);
  color: var(--danger);
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

@media (max-width: 860px) {
  .sk-board { grid-template-columns: 1fr; }
}
/* ===== RESPONSIVE ===== */
@media (max-width: 860px) {
  .enhanced-head h1 {
    font-size: 21px;
  }
}

@media (max-width: 640px) {
  .project-head {
    flex-direction: column;
    align-items: stretch;
  }

  .project-head-info {
    width: 100%;
  }

  .project-desc {
    max-width: 100%;
  }

  .page-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .view-toggle {
    flex: 1 1 auto;
    display: flex;
  }

  .view-toggle button {
    flex: 1;
  }

  .action-divider {
    display: none;
  }

  .btn-add {
    flex: 1 1 auto;
    justify-content: center;
  }

  .member-section {
    flex-wrap: wrap;
    row-gap: 8px;
  }

  .empty-state {
    padding: 40px 16px;
  }

  .empty-state.error-state {
    min-height: 40vh;
  }

  .sk-head {
    flex-direction: column;
    gap: 14px;
  }

  .sk-actions {
    width: 100%;
  }

  .sk-btn {
    flex: 1;
  }
}

@media (max-width: 420px) {
  .page-actions {
    gap: 8px;
  }

  .enhanced-icon-btn {
    width: 34px;
    height: 34px;
  }

  .enhanced-head h1 {
    font-size: 19px;
  }
}
</style>