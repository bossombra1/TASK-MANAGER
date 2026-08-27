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
        <FormField label="Titre de la tâche">
          <Input type="text" v-model="form.title" placeholder="Ex : Intégrer le formulaire de contact" />
        </FormField>

        <FormField label="Description">
          <Textarea v-model="form.description" placeholder="Ajoutez des détails utiles à l'équipe..." />
        </FormField>

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
        </div>

        <div class="form-row">
          <FormField label="Date de début">
            <Input v-model="form.start_date" type="date" />
          </FormField>
          <FormField label="Date d'échéance">
            <Input v-model="form.due_date" type="date" />
          </FormField>
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
        <Button class="btn btn-ghost" @click="$emit('close')">Annuler</Button>
        <Button class="btn btn-primary" style="width:auto;" :disabled="!form.title.trim() || creating" @click="submit">
          {{ creating ? 'Création...' : 'Créer la tâche' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTasksStore } from '../../stores/tasks';
import { useToastStore } from '../../stores/toast';
import { ref } from 'vue';
import Avatar from '../atoms/Avatar.vue';
import Button from '../atoms/Button.vue';
import Input from '../atoms/Input.vue';
import Textarea from '../atoms/Textarea.vue';
import FormField from '../molecules/FormField.vue';

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
  start_date: '',
  due_date: '',
  assignedIds: [],
});

const tasksStore = useTasksStore();
const toast = useToastStore();
const creating = ref(false);
const error = ref('');

const toggleAssignee = (id) => {
  const idx = form.value.assignedIds.indexOf(id);
  if (idx === -1) form.value.assignedIds.push(id);
  else form.value.assignedIds.splice(idx, 1);
};

const submit = async () => {
  if (!form.value.title.trim()) return;
  if (form.value.start_date && form.value.due_date && form.value.start_date > form.value.due_date) {
    error.value = "La date de début doit précéder la date d'échéance";
    return;
  }
  creating.value = true;
  error.value = '';
  try {
    const task = await tasksStore.createTask({
      project_id: props.projectId,
      title: form.value.title.trim(),
      description: form.value.description.trim() || null,
      priority: form.value.priority,
      start_date: form.value.start_date || null,
      due_date: form.value.due_date || null,
      assigned_user_ids: form.value.assignedIds,
    });

    if (task.planWarning) {
      toast.show(task.planWarning);
    }

    const assignees = props.members.filter((m) => form.value.assignedIds.includes(m.id));
    emit('created', { ...task, assignees });
    emit('close');
  } catch (err) {
    if (err.response?.data?.planLimitReached) {
      emit('close');
    } else {
      error.value = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Erreur lors de la création';
    }
  } finally {
    creating.value = false;
  }
};
</script>