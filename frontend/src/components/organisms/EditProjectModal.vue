<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-head">
        <h3>Modifier le projet</h3>
        <button class="modal-close" @click="$emit('close')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <FormField label="Nom du projet">
          <Input type="text" v-model="form.title" />
        </FormField>
        <FormField label="Description">
          <Textarea v-model="form.description" />
        </FormField>
        <div class="form-group" style="margin-bottom:0;">
          <label>Couleur</label>
          <div class="color-swatches">
            <div
              v-for="c in colors"
              :key="c"
              class="color-swatch"
              :class="{ selected: form.color === c }"
              :style="{ background: c }"
              @click="form.color = c"
            ></div>
          </div>
        </div>
        <p v-if="error" style="color:var(--danger); font-size:12.5px; margin-top:12px;">{{ error }}</p>
      </div>
      <div class="modal-foot">
        <Button class="btn btn-ghost" @click="$emit('close')">Annuler</Button>
        <Button class="btn btn-primary" style="width:auto;" :disabled="!form.title.trim() || saving" @click="submit">
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useProjectsStore } from '../../stores/projects';
import Button from '../atoms/Button.vue';
import Input from '../atoms/Input.vue';
import Textarea from '../atoms/Textarea.vue';
import FormField from '../molecules/FormField.vue';

const props = defineProps({
  project: { type: Object, required: true },
});
const emit = defineEmits(['close', 'updated']);

const projectsStore = useProjectsStore();

const colors = ['#E8523F', '#6C5CE7', '#3B7DDD', '#2F9E44', '#E0A62E'];

const form = ref({
  title: props.project.title,
  description: props.project.description || '',
  color: props.project.color || colors[0],
});

const saving = ref(false);
const error = ref('');

const submit = async () => {
  if (!form.value.title.trim()) return;
  saving.value = true;
  error.value = '';
  try {
    const updated = await projectsStore.updateProject(props.project.id, {
      title: form.value.title.trim(),
      description: form.value.description.trim() || null,
      color: form.value.color,
    });
    emit('updated', updated);
    emit('close');
  } catch (err) {
    error.value = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Erreur lors de la mise à jour';
  } finally {
    saving.value = false;
  }
};
</script>