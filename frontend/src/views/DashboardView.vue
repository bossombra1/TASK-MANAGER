<template>
  <AppLayout title="Tableau de bord">
    <div class="page-head enhanced-head">
      <div>
        <h1>Tableau de bord</h1>
        <p>{{ totalProjects }} projet{{ totalProjects > 1 ? 's' : '' }} · {{ totalTasks }} tâche{{ totalTasks > 1 ? 's' : '' }} suivie{{ totalTasks > 1 ? 's' : '' }}</p>
      </div>
    </div>

    <!-- État de chargement (Skeleton) -->
    <div v-if="loading" class="skeleton-wrapper">
      <div class="stat-grid">
        <div v-for="i in 6" :key="i" class="stat-card sk-card">
          <div class="sk-icon"></div>
          <div class="sk-info">
            <div class="sk-line w-60"></div>
            <div class="sk-line w-40"></div>
          </div>
        </div>
      </div>
      <div class="panel-grid">
        <div class="panel sk-panel" v-for="i in 2" :key="i">
          <div class="sk-line w-30" style="height: 16px; margin-bottom: 24px;"></div>
          <div class="sk-bar" v-for="j in 3" :key="j"></div>
        </div>
      </div>
    </div>

    <div v-else class="dashboard-container">
      <!-- Cartes Statistiques -->
      <div class="stat-grid">
        <div class="stat-card" v-for="(stat, index) in stats" :key="index" :style="{ animationDelay: `${index * 0.05}s` }" :class="{ danger: stat.isDanger }">
          <div class="stat-icon" :class="stat.cssClass">
            <component :is="stat.icon" />
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-sub" v-if="stat.sub">{{ stat.sub }}</div>
          </div>
        </div>
      </div>

      <!-- Panneaux de répartition -->
      <div class="panel-grid">
        <div class="panel chart-panel">
          <div class="panel-head">
            <h3>Tâches par statut</h3>
          </div>
          <div class="stat-bar-row" v-for="row in statusRows" :key="row.label">
            <div class="row-top">
              <Badge :class="row.badge">{{ row.label }}</Badge>
              <span class="count">{{ row.count }}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" :style="{ width: pct(row.count) + '%', background: row.color }"></div>
            </div>
          </div>
        </div>

        <div class="panel chart-panel">
          <div class="panel-head">
            <h3>Tâches par priorité</h3>
          </div>
          <div class="stat-bar-row" v-for="row in priorityRows" :key="row.label">
            <div class="row-top">
              <Badge :class="row.badge">{{ row.label }}</Badge>
              <span class="count">{{ row.count }}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" :style="{ width: pct(row.count) + '%', background: row.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panneau des Alertes -->
      <div class="panel alert-panel">
        <div class="panel-head">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Alertes de retard
          </h3>
          <span class="alert-count" v-if="overdueTasks.length > 0">{{ overdueTasks.length }}</span>
        </div>

        <div v-if="overdueTasks.length === 0" class="empty-success">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <h4>Tout est à jour !</h4>
          <p>Aucune tâche n'est en retard. Bon travail.</p>
        </div>

        <TaskTable
          v-else
          :tasks="overdueTasks"
          variant="dashboard"
          :show-project="true"
          :show-status="false"
          :is-overdue="isOverdue"
        />
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import Badge from '../components/atoms/Badge.vue';
import TaskTable from '../components/organisms/TaskTable.vue';
import { computed, onMounted, ref, h } from 'vue';
import AppLayout from '../components/templates/AppLayout.vue';
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

const isOverdue = (task) => task && task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

// Configuration des rangées pour les graphiques
const statusRows = computed(() => [
  { label: 'À faire', count: tasksByStatus.value.todo, badge: 'badge-todo', color: 'var(--todo)' },
  { label: 'En cours', count: tasksByStatus.value.doing, badge: 'badge-progress', color: 'var(--info)' },
  { label: 'Terminé', count: tasksByStatus.value.done, badge: 'badge-done', color: 'var(--success)' },
]);

const priorityRows = computed(() => [
  { label: 'Basse', count: tasksByPriority.value.low, badge: 'badge-low', color: 'var(--text-2)' },
  { label: 'Moyenne', count: tasksByPriority.value.medium, badge: 'badge-medium', color: 'var(--accent)' },
  { label: 'Haute', count: tasksByPriority.value.high, badge: 'badge-high', color: 'var(--danger)' },
]);

// Formatage des cartes statistiques
const stats = computed(() => [
  {
    label: 'Projets',
    value: totalProjects.value,
    cssClass: 'projects',
    icon: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('rect', { x: 3, y: 3, width: 7, height: 9, rx: 1 }),
      h('rect', { x: 14, y: 3, width: 7, height: 5, rx: 1 }),
      h('rect', { x: 14, y: 12, width: 7, height: 9, rx: 1 }),
      h('rect', { x: 3, y: 16, width: 7, height: 5, rx: 1 })
    ])
  },
  {
    label: 'Tâches totales',
    value: totalTasks.value,
    cssClass: 'tasks',
    icon: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { d: 'M9 11l3 3L22 4' }),
      h('path', { d: 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' })
    ])
  },
  {
    label: 'Tâches terminées',
    value: `${completionRate.value}%`,
    sub: `${tasksByStatus.value.done} / ${totalTasks.value} tâches`,
    cssClass: 'success',
    icon: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
      h('polyline', { points: '22 4 12 14.01 9 11.01' })
    ])
  },
  {
    label: 'Projets terminés',
    value: `${projectCompletionRate.value}%`,
    sub: `${finishedProjects.value.length} / ${totalProjects.value} projets`,
    cssClass: 'success',
    icon: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
      h('polyline', { points: '22 4 12 14.01 9 11.01' })
    ])
  },
  {
    label: 'Tâches en retard',
    value: overdueTasks.value.length,
    isDanger: overdueTasks.value.length > 0,
    cssClass: 'danger',
    icon: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
      h('line', { x1: 12, y1: 9, x2: 12, y2: 13 }),
      h('line', { x1: 12, y1: 17, x2: 12.01, y2: 17 })
    ])
  },
  {
    label: 'Projets en retard',
    value: overdueProjects.value.length,
    isDanger: overdueProjects.value.length > 0,
    cssClass: 'danger',
    icon: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
      h('line', { x1: 12, y1: 9, x2: 12, y2: 13 }),
      h('line', { x1: 12, y1: 17, x2: 12.01, y2: 17 })
    ])
  }
]);

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

<style scoped>
/* --- Layout général --- */
.enhanced-head {
  margin-bottom: 28px;
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

.dashboard-container {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Cartes Statistiques --- */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.projects { background: var(--info-soft, #e9f1fd); color: var(--info, #3b7ddd); }
.stat-icon.tasks { background: var(--violet-soft, #efedfc); color: var(--violet, #6c5ce7); }
.stat-icon.success { background: var(--success-soft, #e6f6ea); color: var(--success, #2fa85a); }
.stat-icon.danger { background: var(--danger-soft, #fdebeb); color: var(--danger, #d9463a); }

.stat-card.danger {
  border-color: var(--danger-soft, #fdebeb);
  background: #fffdfc;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 13px;
  color: var(--text-3, #999);
  font-weight: 500;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-1, #1a1a1a);
  line-height: 1.1;
}

.stat-sub {
  font-size: 12px;
  color: var(--text-3, #999);
  margin-top: 4px;
}

/* --- Panneaux (Graphiques) --- */
.panel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 28px;
}

.panel {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: var(--text-1, #1a1a1a);
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-count {
  background: var(--danger, #d9463a);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}

/* --- Barres de progression --- */
.stat-bar-row {
  margin-bottom: 18px;
}

.stat-bar-row:last-child {
  margin-bottom: 0;
}

.row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.count {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-1, #1a1a1a);
}

.stat-bar-track {
  height: 8px;
  background: var(--surface-2, #f3f1ee);
  border-radius: 4px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s cubic-bezier(0.22, 1, 0.36, 1);
}

/* --- Panneau Alertes --- */
.alert-panel {
  border-left: 4px solid var(--danger, #d9463a);
}

.alert-panel .panel-head h3 svg {
  color: var(--danger, #d9463a);
}

.empty-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: var(--success, #2fa85a);
}

.empty-success svg {
  margin-bottom: 16px;
  background: var(--success-soft, #e6f6ea);
  padding: 12px;
  border-radius: 50%;
  width: 72px;
  height: 72px;
}

.empty-success h4 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-1, #1a1a1a);
  margin-bottom: 4px;
}

.empty-success p {
  font-size: 14px;
  color: var(--text-2, #555);
}

/* --- Squelettes de chargement --- */
.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.sk-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 16px;
}

.sk-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--surface-2, #f3f1ee);
}

.sk-info {
  flex: 1;
}

.sk-line {
  height: 12px;
  border-radius: 4px;
  background: var(--surface-2, #f3f1ee);
  margin-bottom: 8px;
}

.sk-panel {
  height: 200px;
}

.sk-bar {
  height: 8px;
  border-radius: 4px;
  background: var(--surface-2, #f3f1ee);
  margin-bottom: 18px;
}

.w-60 { width: 60%; }
.w-40 { width: 40%; }
.w-30 { width: 30%; }

.skeleton-wrapper > * {
  position: relative;
  overflow: hidden;
}

.skeleton-wrapper > *::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer { 100% { transform: translateX(100%); } }

/* --- Responsive --- */
@media (max-width: 860px) {
  .stat-grid { grid-template-columns: 1fr; }
  .panel-grid { grid-template-columns: 1fr; }
}
</style>