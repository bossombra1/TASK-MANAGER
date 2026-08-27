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

    <TaskToolbar
      :status="filters.status"
      :assignee="filters.assignee"
      :keyword="filters.keyword"
      :assignees="allAssignees"
      @update:status="(value) => (filters.status = value)"
      @update:assignee="(value) => (filters.assignee = value)"
      @update:keyword="(value) => (filters.keyword = value)"
    />

    <p v-if="loading" style="color:var(--text-2); font-size:13px;">Chargement...</p>
    <p v-else-if="tasks.length === 0" style="color:var(--text-2); font-size:13px;">
      Aucune tâche pour le moment.
    </p>
    <p v-else-if="filteredTasks.length === 0" style="color:var(--text-2); font-size:13px;">
      Aucune tâche ne correspond à ces filtres.
    </p>

    <TaskTable
      v-else-if="viewMode === 'list'"
      :tasks="filteredTasks"
      variant="tasks"
      :show-project="true"
      :is-overdue="isOverdue"
      @open="openTask"
      @update-status="changeStatus"
    />

    <KanbanBoard
      v-else-if="viewMode === 'kanban'"
      :columns="columns"
      :tasks="filteredTasks"
      :show-project-title="true"
      :status-badge="statusBadge"
      :priority-badge="priorityBadge"
      :priority-label="priorityLabel"
      :format-date="formatDate"
      :is-overdue="isOverdue"
      @open-task="openTask"
      @change-status="changeStatus"
    />
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/templates/AppLayout.vue';
import TaskToolbar from '../components/organisms/TaskToolbar.vue';
import TaskTable from '../components/organisms/TaskTable.vue';
import KanbanBoard from '../components/organisms/KanbanBoard.vue';
import { useProjectsStore } from '../stores/projects';
import { useTasksStore } from '../stores/tasks';

const router = useRouter();
const projectsStore = useProjectsStore();
const tasksStore = useTasksStore();

const loading = ref(true);
const viewMode = ref('list');
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

const openTask = (task) => {
  router.push(`/projects/${task.project_id}/tasks/${task.id}`);
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
