<template>
  <div class="toolbar">
    <select class="filter-select" :value="status" @change="$emit('update:status', $event.target.value)">
      <option value="">Tous les statuts</option>
      <option value="todo">À faire</option>
      <option value="doing">En cours</option>
      <option value="done">Terminé</option>
    </select>

    <select
      v-if="showAssignee && assignees.length > 0"
      class="filter-select"
      :value="assignee"
      @change="$emit('update:assignee', $event.target.value)"
    >
      <option value="">Tous les assignés</option>
      <option v-for="a in assignees" :key="a.id" :value="a.id">{{ a.nom }}</option>
    </select>

    <div class="search-box">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
      <Input
        :modelValue="keyword"
        @update:modelValue="$emit('update:keyword', $event)"
        placeholder="Rechercher une tâche..."
      />
    </div>
  </div>
</template>

<script setup>
import Input from '../atoms/Input.vue';

const props = defineProps({
  status: { type: String, default: '' },
  assignee: { type: [String, Number], default: '' },
  keyword: { type: String, default: '' },
  assignees: { type: Array, default: () => [] },
  showAssignee: { type: Boolean, default: true },
});

const emit = defineEmits(['update:status', 'update:assignee', 'update:keyword']);
</script>
