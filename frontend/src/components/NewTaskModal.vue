<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-head">
        <h3>Nouvelle tâche</h3>
        <button class="modal-close" @click="$emit('close')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>Titre de la tâche</label>
          <input type="text" v-model="form.title" placeholder="Ex : Intégrer le formulaire de contact" />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" placeholder="Ajoutez des détails utiles à l'équipe..."></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Priorité</label>
            <div class="segmented">
              <button
                v-for="p in priorities"
                :key="p.value"
                type="button"
                :class="{ selected: form.priority === p.value }"
                @click="form.priority = p.value"
              >{{ p.label }}</button>
            </div>
          </div>
          <div class="form-group">
            <label>Date d'échéance</label>
            <input type="date" v-model="form.due_date" />
          </div>
        </div>

        <div class="form-group">
          <label>Assigné(e)s</label>
          <div class="chip-select">
            <div
              v-for="m in members"
              :key="m.id"
              class="chip-toggle"
              :class="{ selected: form.assignedIds.includes(m.id) }"
              @click="toggleAssignee(m.id)"
            >
              <Avatar :user-id="m.id" :nom="m.nom" :avatar-url="m.avatar_url" :size="22" />
              {{ m.nom }}
            </div>
          </div>
          <div class="field-hint">Seuls les membres du projet peuvent être assignés.</div>
        </div>

        <p v-if="error" style="color:var(--danger); font-size:12.5px;">{{ error }}</p>
      </div>

      <div class="modal-foot">
        <button class="btn btn-ghost" @click="$emit('close')">Annuler</button>
        <button class="btn btn-primary" style="width:auto;" :disabled="!form.title.trim() || creating" @click="submit">
          {{ creating ? 'Création...' : 'Créer la tâche' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTasksStore } from '../stores/tasks';
import { ref } from 'vue';
import api from '../services/api';
import Avatar from './Avatar.vue';

const props = defineProps({
  projectId: { type: String, required: true },
  members: { type: Array, default: () => [] },
});
const emit = defineEmits(['close', 'created']);

const priorities = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
];

const form = ref({
  title: '',
  description: '',
  priority: 'medium',
  due_date: '',
  assignedIds: [],
});

const tasksStore = useTasksStore();
const creating = ref(false);
const error = ref('');

const toggleAssignee = (id) => {
  const idx = form.value.assignedIds.indexOf(id);
  if (idx === -1) form.value.assignedIds.push(id);
  else form.value.assignedIds.splice(idx, 1);
};

const submit = async () => {
  if (!form.value.title.trim()) return;
  creating.value = true;
  error.value = '';
  try {
    const task = await tasksStore.createTask({
      project_id: props.projectId,
      title: form.value.title.trim(),
      description: form.value.description.trim() || null,
      priority: form.value.priority,
      due_date: form.value.due_date || null,
      assigned_user_ids: form.value.assignedIds,
    });

    const assignees = props.members.filter((m) => form.value.assignedIds.includes(m.id));
    emit('created', { ...task, assignees });
    emit('close');
  } catch (err) {
    error.value = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Erreur lors de la création';
  } finally {
    creating.value = false;
  }
};
</script>