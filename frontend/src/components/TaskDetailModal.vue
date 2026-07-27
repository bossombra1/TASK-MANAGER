<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-panel">
      <div class="modal-head">
        <input v-model="form.title" class="modal-title-input" placeholder="Titre de la tâche" />
        <button class="modal-close" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="modal-row">
          <div class="modal-field">
            <label>Statut</label>
            <select v-model="form.status">
              <option value="todo">À faire</option>
              <option value="doing">En cours</option>
              <option value="done">Terminé</option>
            </select>
          </div>
          <div class="modal-field">
            <label>Priorité</label>
            <select v-model="form.priority">
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>
          <div class="modal-field">
            <label>Échéance</label>
            <input type="date" v-model="form.due_date" />
          </div>
        </div>

        <div class="modal-field">
          <label>Description</label>
          <textarea v-model="form.description" rows="4" placeholder="Aucune description"></textarea>
        </div>

        <div class="modal-field">
          <label>Assigné(s)</label>
          <div class="avatar-stack">
            <div
              v-for="a in task.assignees || []"
              :key="a.id"
              class="avatar"
              :style="{ width: '26px', height: '26px', fontSize: '10.5px', background: colorFor(a.id) }"
              :title="a.nom"
            >
              {{ initials(a.nom) }}
            </div>
            <span v-if="!(task.assignees || []).length" style="font-size:12.5px; color:var(--text-3);">Personne assigné</span>
          </div>
        </div>
      </div>

      <div class="modal-foot">
        <span v-if="saveError" class="modal-error">{{ saveError }}</span>
        <button class="modal-btn-ghost" @click="$emit('close')">Annuler</button>
        <button class="modal-btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import api from '../services/api';
import { colorFor, initials } from '../utils/colors';

const props = defineProps({ task: { type: Object, required: true } });
const emit = defineEmits(['close', 'updated']);

const buildForm = (t) => ({
  title: t.title,
  status: t.status,
  priority: t.priority,
  due_date: t.due_date ? t.due_date.slice(0, 10) : '',
  description: t.description || '',
});

const form = ref(buildForm(props.task));
const saving = ref(false);
const saveError = ref('');

watch(() => props.task, (t) => { form.value = buildForm(t); });

const save = async () => {
  saving.value = true;
  saveError.value = '';
  try {
    const { data } = await api.put(`/tasks/${props.task.id}`, {
      title: form.value.title,
      description: form.value.description,
      priority: form.value.priority,
      due_date: form.value.due_date || null,
    });

    if (form.value.status !== props.task.status) {
      await api.patch(`/tasks/${props.task.id}/status`, { status: form.value.status });
    }

    emit('updated', { ...props.task, ...data.task, status: form.value.status });
    emit('close');
  } catch (err) {
    saveError.value = "Échec de l'enregistrement";
    console.error(err);
  } finally {
    saving.value = false;
  }
};
</script>