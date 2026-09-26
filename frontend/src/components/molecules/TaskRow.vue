<template>
  <tr :class="['task-row', { overdue: isOverdue } ]" @click="handleRowClick">
    <template v-if="variant === 'project'">
      <td data-label="Tâche">
        <div class="task-title-cell">
          <span class="check" :class="{ done: task.status === 'done' }"></span>
          {{ task.title }}
        </div>
      </td>
      <td data-label="Statut">
        <select class="status-select" :value="task.status" @click.stop @change="onStatusChange($event.target.value)">
          <option value="todo">À faire</option>
          <option value="doing">En cours</option>
          <option value="done">Terminé</option>
        </select>
      </td>
      <td data-label="Priorité"><Badge :class="priorityBadge(task.priority)">{{ priorityLabel(task.priority) }}</Badge></td>
      <td data-label="Assigné">
        <div class="avatar-stack">
          <Avatar v-for="a in (task.assignees || []).slice(0,3)" :key="a.id" :user-id="a.id" :nom="a.nom" :avatar-url="a.avatar_url" :size="24" />
        </div>
      </td>
      <td data-label="Échéance">
        <div class="due-date" :class="{ late: isOverdue }">
          {{ task.due_date ? formatDate(task.due_date) : '—' }}<span v-if="isOverdue"> · en retard</span>
        </div>
      </td>
    </template>

    <template v-else-if="variant === 'tasks'">
      <td data-label="Tâche">
        <div class="task-title-cell">
          <span class="check" :class="{ done: task.status === 'done' }"></span>
          {{ task.title }}
        </div>
      </td>
      <td data-label="Projet">{{ task.projectTitle }}</td>
      <td data-label="Statut"><Badge :class="statusBadge(task.status)">{{ statusLabel(task.status) }}</Badge></td>
      <td data-label="Priorité"><Badge :class="priorityBadge(task.priority)">{{ priorityLabel(task.priority) }}</Badge></td>
      <td data-label="Assigné">
        <div class="avatar-stack">
          <Avatar v-for="a in (task.assignees || []).slice(0,3)" :key="a.id" :user-id="a.id" :nom="a.nom" :avatar-url="a.avatar_url" :size="24" />
        </div>
      </td>
      <td data-label="Échéance">
        <div class="due-date" :class="{ late: isOverdue }">
          {{ task.due_date ? formatDate(task.due_date) : '—' }}<span v-if="isOverdue"> · en retard</span>
        </div>
      </td>
    </template>

    <template v-else>
      <td data-label="Tâche">{{ task.title }}</td>
      <td data-label="Projet">{{ task.projectTitle }}</td>
      <td data-label="Priorité"><Badge :class="priorityBadge(task.priority)">{{ priorityLabel(task.priority) }}</Badge></td>
      <td data-label="Assigné">
        <div class="avatar-stack">
          <Avatar v-for="a in (task.assignees || []).slice(0,3)" :key="a.id" :user-id="a.id" :nom="a.nom" :avatar-url="a.avatar_url" :size="22" />
        </div>
      </td>
      <td data-label="Échéance">
        <div class="due-date" :class="{ late: isOverdue }">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          {{ task.due_date ? formatDate(task.due_date) : '—' }}<span v-if="isOverdue"> · en retard</span>
        </div>
      </td>
    </template>
  </tr>
</template>

<script setup>
import Avatar from '../atoms/Avatar.vue';
import Badge from '../atoms/Badge.vue';

const props = defineProps({ task: { type: Object, required: true }, variant: { type: String, default: 'project' }, isOverdue: { type: Boolean, default: false } });
const emit = defineEmits(['open', 'update-status']);

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
const statusBadge = (status) => ({ todo: 'badge-todo', doing: 'badge-progress', done: 'badge-done' }[status] || 'badge-todo');
const statusLabel = (status) => ({ todo: 'À faire', doing: 'En cours', done: 'Terminé' }[status] || status);
const priorityBadge = (priority) => ({ low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }[priority] || 'badge-low');
const priorityLabel = (priority) => ({ low: 'Basse', medium: 'Moyenne', high: 'Haute' }[priority] || priority);

const handleRowClick = () => {
  if (['project', 'tasks', 'dashboard'].includes(props.variant)) {
    emit('open', props.task);
  }
};

const onStatusChange = (val) => {
  emit('update-status', props.task, val);
};
</script>