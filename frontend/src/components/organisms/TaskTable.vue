<template>
  <table class="task-table">
    <thead>
      <tr>
        <th>Tâche</th>
        <th v-if="showProject">Projet</th>
        <th v-if="showStatus">Statut</th>
        <th>Priorité</th>
        <th>Assigné</th>
        <th>Échéance</th>
      </tr>
    </thead>
    <tbody>
      <TaskRow
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :variant="variant"
        :is-overdue="isOverdue(task)"
        @open="handleOpen"
        @update-status="handleUpdateStatus"
      />
    </tbody>
  </table>
</template>

<script setup>
import TaskRow from '../molecules/TaskRow.vue';

const props = defineProps({
  tasks: { type: Array, required: true },
  variant: { type: String, default: 'project' },
  showProject: { type: Boolean, default: false },
  showStatus: { type: Boolean, default: true },
  isOverdue: { type: Function, required: true },
});

const emit = defineEmits(['open', 'update-status']);

const handleOpen = (task) => emit('open', task);
const handleUpdateStatus = (task, status) => emit('update-status', task, status);
</script>
