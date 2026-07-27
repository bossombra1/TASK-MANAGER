<template>
  <AppLayout :title="project?.title || 'Projet'">
    <div v-if="loading" style="color:var(--text-2); font-size:13px;">Chargement...</div>
    <p v-else-if="!project" style="color:var(--text-2); font-size:13px;">
      Ce projet n'existe plus ou a été supprimé.
      <router-link to="/projects" style="color:var(--accent); font-weight:600;">Retour aux projets</router-link>
    </p>

    <template v-else-if="project">
      <div class="page-head project-head">
        <div class="project-head-info">
          <h1>{{ project.title }}</h1>
          <p class="project-desc" :title="project.description || ''">{{ project.description || 'Pas de description' }}</p>
        </div>
        <div class="page-actions">
          <div class="view-toggle">
            <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">Liste</button>
            <button :class="{ active: viewMode === 'kanban' }" @click="viewMode = 'kanban'">Kanban</button>
          </div>
          <button class="icon-btn" :title="pinned ? 'Retirer des favoris' : 'Épingler ce projet'" @click="handleTogglePin">
            <svg v-if="pinned" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:var(--accent);"><path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5 2.3-7.2-6-4.6h7.6z"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5 2.3-7.2-6-4.6h7.6z"/></svg>
          </button>
          <button v-if="auth.isAdmin" class="btn btn-primary btn-add" style="width:auto;" @click="showNewTaskModal = true">
            + Nouvelle tâche
          </button>
          <button v-if="auth.isAdmin" class="btn btn-ghost" style="width:auto;" @click="showEditProjectModal = true">
            Modifier
          </button>
          <button v-if="auth.isAdmin" class="btn btn-ghost" style="width:auto; color:var(--danger); border-color:var(--danger-soft);" @click="handleDeleteProject">
            Supprimer
          </button>
        </div>
      </div>

      <div class="avatar-stack" style="margin-bottom:22px;">
        <Avatar
          v-for="member in project.members"
          :key="member.id"
          :user-id="member.id"
          :nom="member.nom"
          :avatar-url="member.avatar_url"
          :size="28"
          :title="member.nom"
        />
      </div>

      <div class="toolbar">
        <select class="filter-select" v-model="filters.status">
          <option value="">Tous les statuts</option>
          <option value="todo">À faire</option>
          <option value="doing">En cours</option>
          <option value="done">Terminé</option>
        </select>
        <select class="filter-select" v-model="filters.assignee">
          <option value="">Tous les assignés</option>
          <option v-for="m in project.members" :key="m.id" :value="m.id">{{ m.nom }}</option>
        </select>
        <div class="search-box">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
          <input v-model="filters.keyword" placeholder="Rechercher une tâche..." />
        </div>
      </div>

      <p v-if="tasks.length > 0 && filteredTasks.length === 0" style="color:var(--text-2); font-size:13px; margin-bottom:16px;">
        Aucune tâche ne correspond à ces filtres.
      </p>

      <!-- ===== VUE LISTE ===== -->
      <table v-if="viewMode === 'list'" class="task-table">
        <thead>
          <tr><th>Tâche</th><th>Statut</th><th>Priorité</th><th>Assigné</th><th>Échéance</th></tr>
        </thead>
        <tbody>
          <tr
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-row"
            :class="{ overdue: isOverdue(task) }"
            @click="openTask(task)"
          >
            <td><div class="task-title-cell"><span class="check" :class="{ done: task.status === 'done' }"></span>{{ task.title }}</div></td>
            <td>
              <select class="status-select" :value="task.status" @click.stop @change="changeStatus(task, $event.target.value)">
                <option value="todo">À faire</option>
                <option value="doing">En cours</option>
                <option value="done">Terminé</option>
              </select>
            </td>
            <td><span class="badge" :class="priorityBadge(task.priority)">{{ priorityLabel(task.priority) }}</span></td>
            <td>
              <div class="avatar-stack">
                <Avatar v-for="a in (task.assignees || []).slice(0,3)" :key="a.id" :user-id="a.id" :nom="a.nom" :avatar-url="a.avatar_url" :size="24" />
              </div>
            </td>
            <td>
              <div class="due-date" :class="{ late: isOverdue(task) }">
                {{ task.due_date ? formatDate(task.due_date) : '—' }}<span v-if="isOverdue(task)"> · en retard</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ===== VUE KANBAN ===== -->
      <div v-else class="kanban-board">
        <div
          v-for="column in columns"
          :key="column.status"
          class="kanban-column"
          :class="{ 'drag-over': dragOverColumn === column.status }"
          @dragover.prevent="dragOverColumn = column.status"
          @dragleave="dragOverColumn = null"
          @drop="handleDrop(column.status)"
        >
          <div class="kanban-col-head">
            <span class="badge" :class="statusBadge(column.status)">{{ column.label }}</span>
            <span class="kanban-count">{{ tasksByStatus(column.status).length }}</span>
          </div>

          <div class="kanban-cards">
            <p v-if="tasksByStatus(column.status).length === 0" class="kanban-empty">Aucune tâche</p>

            <div
              v-for="task in tasksByStatus(column.status)"
              :key="task.id"
              class="kanban-card"
              draggable="true"
              @dragstart="handleDragStart(task)"
              @dragend="dragOverColumn = null"
              @click="openTask(task)"
            >
              <p class="kanban-card-title">{{ task.title }}</p>
              <div class="kanban-card-foot">
                <span class="badge" :class="priorityBadge(task.priority)">{{ priorityLabel(task.priority) }}</span>
                <div class="avatar-stack">
                  <Avatar v-for="a in (task.assignees || []).slice(0,3)" :key="a.id" :user-id="a.id" :nom="a.nom" :avatar-url="a.avatar_url" :size="22" />
                </div>
              </div>
              <div v-if="task.due_date" class="due-date" :class="{ late: isOverdue(task) }" style="margin-top:6px;">
                {{ formatDate(task.due_date) }}<span v-if="isOverdue(task)"> · en retard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
import EditProjectModal from '../components/EditProjectModal.vue';
import { pushRecentProject, removeRecentProject } from '../utils/recentProjects';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/AppLayout.vue';
import NewTaskModal from '../components/NewTaskModal.vue';
import Avatar from '../components/Avatar.vue';
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
const draggedTask = ref(null);
const dragOverColumn = ref(null);
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

const tasksByStatus = (status) => filteredTasks.value.filter((t) => t.status === status);

const openTask = (task) => {
  router.push(`/projects/${projectId.value}/tasks/${task.id}`);
};

const handleTaskCreated = () => {
  // rien à faire ici : NewTaskModal appelle déjà tasksStore.createTask,
  // donc le store est déjà à jour et `tasks` (computed) le reflète automatiquement
};

const handleProjectUpdated = () => {
  // idem : EditProjectModal doit appeler projectsStore.updateProject (à vérifier),
  // qui met déjà à jour projectsStore.details
};

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

const handleDragStart = (task) => { draggedTask.value = task; };

const handleDrop = async (newStatus) => {
  dragOverColumn.value = null;
  if (!draggedTask.value || draggedTask.value.status === newStatus) return;
  await changeStatus(draggedTask.value, newStatus);
  draggedTask.value = null;
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
    await projectsStore.fetchProjectDetail(projectId.value, true); // true : toujours frais en arrivant sur la page
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