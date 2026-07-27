<template>
  <AppLayout title="Mes tâches">
    <div class="page-head">
      <div>
        <h1>Mes tâches</h1>
        <p>{{ tasks.length }} tâche{{ tasks.length > 1 ? 's' : '' }} sur l'ensemble de vos projets</p>
      </div>
      <div class="view-toggle">
        <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">Liste</button>
        <button :class="{ active: viewMode === 'kanban' }" @click="viewMode = 'kanban'">Kanban</button>
      </div>
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
        <option v-for="a in allAssignees" :key="a.id" :value="a.id">{{ a.nom }}</option>
      </select>
      <div class="search-box">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
        <input v-model="filters.keyword" placeholder="Rechercher une tâche..." />
      </div>
    </div>

    <p v-if="loading" style="color:var(--text-2); font-size:13px;">Chargement...</p>
    <p v-else-if="tasks.length === 0" style="color:var(--text-2); font-size:13px;">
      Aucune tâche pour le moment.
    </p>
    <p v-else-if="filteredTasks.length === 0" style="color:var(--text-2); font-size:13px;">
      Aucune tâche ne correspond à ces filtres.
    </p>

    <table v-else-if="viewMode === 'list'" class="task-table">
      <thead><tr><th>Tâche</th><th>Projet</th><th>Statut</th><th>Priorité</th><th>Assigné</th><th>Échéance</th></tr></thead>
      <tbody>
        <tr
          v-for="task in filteredTasks"
          :key="task.id"
          class="task-row"
          :class="{ overdue: isOverdue(task) }"
          @click="openTask(task)"
        >
          <td>
            <div class="task-title-cell">
              <span class="check" :class="{ done: task.status === 'done' }"></span>
              {{ task.title }}
            </div>
          </td>
          <td>{{ task.projectTitle }}</td>
          <td><span class="badge" :class="statusBadge(task.status)">{{ statusLabel(task.status) }}</span></td>
          <td><span class="badge" :class="priorityBadge(task.priority)">{{ priorityLabel(task.priority) }}</span></td>
          <td>
            <div class="avatar-stack">
              <Avatar
                v-for="assignee in (task.assignees || []).slice(0, 3)"
                :key="assignee.id"
                :user-id="assignee.id"
                :nom="assignee.nom"
                :avatar-url="assignee.avatar_url"
                :size="24"
              />
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
            <p style="font-size:11.5px; color:var(--text-3); margin-bottom:8px;">{{ task.projectTitle }}</p>
            <div class="kanban-card-foot">
              <span class="badge" :class="priorityBadge(task.priority)">{{ priorityLabel(task.priority) }}</span>
              <div class="avatar-stack">
                <Avatar
                  v-for="assignee in (task.assignees || []).slice(0, 3)"
                  :key="assignee.id"
                  :user-id="assignee.id"
                  :nom="assignee.nom"
                  :avatar-url="assignee.avatar_url"
                  :size="22"
                />
              </div>
            </div>
            <div v-if="task.due_date" class="due-date" :class="{ late: isOverdue(task) }" style="margin-top:6px;">
              {{ formatDate(task.due_date) }}<span v-if="isOverdue(task)"> · en retard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/AppLayout.vue';
import Avatar from '../components/Avatar.vue';
import { useProjectsStore } from '../stores/projects';
import { useTasksStore } from '../stores/tasks';

const router = useRouter();
const projectsStore = useProjectsStore();
const tasksStore = useTasksStore();

const loading = ref(true);
const viewMode = ref('list');
const draggedTask = ref(null);
const dragOverColumn = ref(null);
const filters = ref({ status: '', assignee: '', keyword: '' });

const columns = [
  { status: 'todo', label: 'À faire' },
  { status: 'doing', label: 'En cours' },
  { status: 'done', label: 'Terminé' },
];

const tasks = computed(() =>
  projectsStore.projects
    .flatMap((p) => (tasksStore.tasksByProject[p.id] || []).map((t) => ({ ...t, projectTitle: p.title })))
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    })
);

const statusBadge = (status) => ({ todo: 'badge-todo', doing: 'badge-progress', done: 'badge-done' }[status] || 'badge-todo');
const statusLabel = (status) => ({ todo: 'À faire', doing: 'En cours', done: 'Terminé' }[status] || status);
const priorityBadge = (priority) => ({ low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }[priority] || 'badge-low');
const priorityLabel = (priority) => ({ low: 'Basse', medium: 'Moyenne', high: 'Haute' }[priority] || priority);
const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
const isOverdue = (task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

const allAssignees = computed(() => {
  const map = new Map();
  tasks.value.forEach((t) => (t.assignees || []).forEach((a) => map.set(a.id, a)));
  return Array.from(map.values());
});

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
  router.push(`/projects/${task.project_id}/tasks/${task.id}`);
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

const fetchAllTasks = async () => {
  loading.value = true;
  try {
    await projectsStore.fetchProjects();
    await Promise.all(projectsStore.projects.map((p) => tasksStore.fetchTasksByProject(p.id).catch(() => {})));
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAllTasks);
</script>