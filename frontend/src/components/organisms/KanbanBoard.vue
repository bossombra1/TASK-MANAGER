<template>
  <div class="kanban-board">
    <div
      v-for="column in columns"
      :key="column.status"
      class="kanban-column"
      :class="{ 'drag-over': dragOverColumn === column.status }"
      @dragover.prevent="setHover(column.status)"
      @dragleave="resetHover"
      @drop="onDrop(column.status)"
    >
      <div class="kanban-col-head">
        <Badge :class="statusBadge(column.status)">{{ column.label }}</Badge>
        <span class="kanban-count">{{ tasksFor(column.status).length }}</span>
      </div>

      <div class="kanban-cards">
        <p v-if="tasksFor(column.status).length === 0" class="kanban-empty">Aucune tâche</p>

        <div
          v-for="task in tasksFor(column.status)"
          :key="task.id"
          class="kanban-card"
          draggable="true"
          @dragstart="onDragStart(task)"
          @dragend="onDragEnd"
          @click="openTask(task)"
        >
          <p class="kanban-card-title">{{ task.title }}</p>
          <p v-if="showProjectTitle" class="kanban-card-meta">{{ task.projectTitle }}</p>
          <div class="kanban-card-foot">
            <Badge :class="priorityBadge(task.priority)">{{ priorityLabel(task.priority) }}</Badge>
            <div class="avatar-stack">
              <Avatar
                v-for="a in (task.assignees || []).slice(0, 3)"
                :key="a.id"
                :user-id="a.id"
                :nom="a.nom"
                :avatar-url="a.avatar_url"
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
</template>

<script setup>
import { ref } from 'vue';
import Avatar from '../atoms/Avatar.vue';
import Badge from '../atoms/Badge.vue';

const props = defineProps({
  columns: { type: Array, required: true },
  tasks: { type: Array, required: true },
  showProjectTitle: { type: Boolean, default: false },
  statusBadge: { type: Function, required: true },
  priorityBadge: { type: Function, required: true },
  priorityLabel: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  isOverdue: { type: Function, required: true },
});

const emit = defineEmits(['open-task', 'change-status']);
const dragOverColumn = ref(null);
const draggedTask = ref(null);

const tasksFor = (status) => props.tasks.filter((t) => t.status === status);
const setHover = (status) => { dragOverColumn.value = status; };
const resetHover = () => { dragOverColumn.value = null; };
const onDragStart = (task) => { draggedTask.value = task; };
const onDragEnd = () => { draggedTask.value = null; dragOverColumn.value = null; };
const onDrop = (status) => {
  if (!draggedTask.value) return;
  const task = draggedTask.value;
  dragOverColumn.value = null;
  draggedTask.value = null;
  if (task.status === status) return;
  emit('change-status', task, status);
};
const openTask = (task) => emit('open-task', task);
</script>
