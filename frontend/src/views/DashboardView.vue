<template>
  <AppLayout title="Tableau de bord">
    <div class="page-head">
      <div>
        <h1>Tableau de bord</h1>
        <p>{{ totalProjects }} projet{{ totalProjects > 1 ? 's' : '' }} · {{ totalTasks }} tâche{{ totalTasks > 1 ? 's' : '' }} suivie{{ totalTasks > 1 ? 's' : '' }}</p>
      </div>
    </div>

    <p v-if="loading" style="color:var(--text-2); font-size:13px;">Chargement...</p>

    <template v-else>
     <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Projets</div>
          <div class="stat-value">{{ totalProjects }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tâches totales</div>
          <div class="stat-value">{{ totalTasks }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tâches terminées</div>
          <div class="stat-value">{{ completionRate }}%</div>
          <div class="stat-sub">{{ tasksByStatus.done }} / {{ totalTasks }} tâches</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Projets terminés</div>
          <div class="stat-value">{{ projectCompletionRate }}%</div>
          <div class="stat-sub">{{ finishedProjects.length }} / {{ totalProjects }} projets</div>
        </div>
        <div class="stat-card" :class="{ danger: overdueTasks.length > 0 }">
          <div class="stat-label">Tâches en retard</div>
          <div class="stat-value">{{ overdueTasks.length }}</div>
        </div>
        <div class="stat-card" :class="{ danger: overdueProjects.length > 0 }">
          <div class="stat-label">Projets en retard</div>
          <div class="stat-value">{{ overdueProjects.length }}</div>
        </div>
      </div>

      <div class="stats-columns">
        <div class="stats-panel">
          <h3>Tâches par statut</h3>
          <div class="stat-bar-row">
            <div class="row-top">
              <span class="badge badge-todo">À faire</span>
              <span class="count">{{ tasksByStatus.todo }}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" :style="{ width: pct(tasksByStatus.todo) + '%', background: 'var(--todo)' }"></div>
            </div>
          </div>
          <div class="stat-bar-row">
            <div class="row-top">
              <span class="badge badge-progress">En cours</span>
              <span class="count">{{ tasksByStatus.doing }}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" :style="{ width: pct(tasksByStatus.doing) + '%', background: 'var(--info)' }"></div>
            </div>
          </div>
          <div class="stat-bar-row">
            <div class="row-top">
              <span class="badge badge-done">Terminé</span>
              <span class="count">{{ tasksByStatus.done }}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" :style="{ width: pct(tasksByStatus.done) + '%', background: 'var(--success)' }"></div>
            </div>
          </div>
        </div>

        <div class="stats-panel">
          <h3>Tâches par priorité</h3>
          <div class="stat-bar-row">
            <div class="row-top">
              <span class="badge badge-low">Basse</span>
              <span class="count">{{ tasksByPriority.low }}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" :style="{ width: pct(tasksByPriority.low) + '%', background: 'var(--text-2)' }"></div>
            </div>
          </div>
          <div class="stat-bar-row">
            <div class="row-top">
              <span class="badge badge-medium">Moyenne</span>
              <span class="count">{{ tasksByPriority.medium }}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" :style="{ width: pct(tasksByPriority.medium) + '%', background: 'var(--accent)' }"></div>
            </div>
          </div>
          <div class="stat-bar-row">
            <div class="row-top">
              <span class="badge badge-high">Haute</span>
              <span class="count">{{ tasksByPriority.high }}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" :style="{ width: pct(tasksByPriority.high) + '%', background: 'var(--danger)' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="page-head" style="margin-bottom:14px;">
        <div><h1 style="font-size:16px;">Alertes de retard</h1></div>
      </div>

      <p v-if="overdueTasks.length === 0" style="color:var(--text-2); font-size:13px;">
        Aucune tâche en retard. 🎉
      </p>

      <table v-else class="task-table">
        <thead><tr><th>Tâche</th><th>Projet</th><th>Priorité</th><th>Assigné</th><th>Échéance</th></tr></thead>
        <tbody>
          <tr v-for="task in overdueTasks" :key="task.id" class="task-row overdue">
            <td><div class="task-title-cell"><span class="check"></span>{{ task.title }}</div></td>
            <td>{{ task.projectTitle }}</td>
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
              <div class="due-date late">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {{ formatDate(task.due_date) }} · en retard
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </AppLayout>
</template>

<script setup>
import Avatar from '../components/Avatar.vue';
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../components/AppLayout.vue';
import { useProjectsStore } from '../stores/projects';
import { useTasksStore } from '../stores/tasks';

const projectsStore = useProjectsStore();
const tasksStore = useTasksStore();
const loading = ref(true);

const totalProjects = computed(() => projectsStore.projects.length);

const projectsData = computed(() =>
  projectsStore.projects.map((p) => ({
    id: p.id,
    title: p.title,
    tasks: tasksStore.tasksByProject[p.id] || [],
  }))
);

const allTasks = computed(() =>
  projectsData.value.flatMap((p) => p.tasks.map((t) => ({ ...t, projectTitle: p.title })))
);

const totalTasks = computed(() => allTasks.value.length);

const tasksByStatus = computed(() => ({
  todo: allTasks.value.filter((t) => t.status === 'todo').length,
  doing: allTasks.value.filter((t) => t.status === 'doing').length,
  done: allTasks.value.filter((t) => t.status === 'done').length,
}));

const tasksByPriority = computed(() => ({
  low: allTasks.value.filter((t) => t.priority === 'low').length,
  medium: allTasks.value.filter((t) => t.priority === 'medium').length,
  high: allTasks.value.filter((t) => t.priority === 'high').length,
}));

const completionRate = computed(() => {
  if (!totalTasks.value) return 0;
  return Math.round((tasksByStatus.value.done / totalTasks.value) * 100);
});

const overdueTasks = computed(() => {
  const now = new Date();
  return allTasks.value
    .filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== 'done')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
});

const finishedProjects = computed(() =>
  projectsData.value.filter((p) => p.tasks.length > 0 && p.tasks.every((t) => t.status === 'done'))
);

const projectCompletionRate = computed(() => {
  if (!totalProjects.value) return 0;
  return Math.round((finishedProjects.value.length / totalProjects.value) * 100);
});

const overdueProjects = computed(() => {
  const now = new Date();
  return projectsData.value.filter((p) =>
    p.tasks.some((t) => t.due_date && new Date(t.due_date) < now && t.status !== 'done')
  );
});

const pct = (count) => {
  if (!totalTasks.value) return 0;
  return Math.round((count / totalTasks.value) * 100);
};

const priorityBadge = (priority) => ({ low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }[priority] || 'badge-low');
const priorityLabel = (priority) => ({ low: 'Basse', medium: 'Moyenne', high: 'Haute' }[priority] || priority);
const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

const fetchStats = async () => {
  loading.value = true;
  try {
    await projectsStore.fetchProjects();
    await Promise.all(projectsStore.projects.map((p) => tasksStore.fetchTasksByProject(p.id).catch(() => {})));
  } finally {
    loading.value = false;
  }
};

onMounted(fetchStats);
</script>