<template>
  <div class="modal-backdrop enhanced-modal-backdrop" @click.self="$emit('close')">
    <div class="modal enhanced-modal">
      <div class="modal-head">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Nouveau projet
        </h3>
        <button class="modal-close" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="modal-body">
        <FormField label="Nom du projet">
          <Input type="text" v-model="form.title" placeholder="Ex : Refonte site web" />
        </FormField>

        <FormField label="Description">
          <Textarea v-model="form.description" placeholder="En une phrase, à quoi sert ce projet ?" />
        </FormField>

        <div class="form-group">
          <label>Couleur du projet</label>
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

        <div class="form-group">
          <label>Membres du projet</label>
          <div class="chip-select-container">
            <div class="chip-select">
              <div
                v-for="u in allUsers"
                :key="u.id"
                class="chip-toggle"
                :class="{ selected: form.memberIds.includes(u.id) }"
                @click="toggleMember(u.id)"
              >
                <Avatar :user-id="u.id" :nom="u.nom" :avatar-url="u.avatar_url" :size="22" />
                {{ u.nom }}
              </div>
            </div>
          </div>
          <div class="field-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Vous pourrez ajouter d'autres membres après la création.
          </div>
        </div>

        <p v-if="error" class="modal-error-text">{{ error }}</p>
      </div>

      <div class="modal-foot">
        <Button class="btn btn-ghost" @click="$emit('close')">Annuler</Button>
        <Button class="btn btn-primary" style="width:auto;" :disabled="!form.title.trim() || creating" @click="submit">
          {{ creating ? 'Création...' : 'Créer le projet' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useProjectsStore } from '../../stores/projects';
import { useToastStore } from '../../stores/toast';
import { ref, onMounted } from 'vue';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth';
import Avatar from '../atoms/Avatar.vue';
import Button from '../atoms/Button.vue';
import Input from '../atoms/Input.vue';
import Textarea from '../atoms/Textarea.vue';
import FormField from '../molecules/FormField.vue';

const emit = defineEmits(['close', 'created']);
const auth = useAuthStore();
const projectsStore = useProjectsStore();
const toast = useToastStore();

const colors = ['#E8523F', '#6C5CE7', '#3B7DDD', '#2F9E44', '#E0A62E'];

const form = ref({
  title: '',
  description: '',
  color: colors[0],
  memberIds: [],
});

const allUsers = ref([]);
const creating = ref(false);
const error = ref('');

const toggleMember = (id) => {
  const idx = form.value.memberIds.indexOf(id);
  if (idx === -1) form.value.memberIds.push(id);
  else form.value.memberIds.splice(idx, 1);
};

const submit = async () => {
  if (!form.value.title.trim()) return;
  creating.value = true;
  error.value = '';
  try {
    const project = await projectsStore.createProject({
      title: form.value.title.trim(),
      description: form.value.description.trim() || null,
      color: form.value.color,
      member_ids: form.value.memberIds,
    });

    if (project.planWarning) {
      toast.show(project.planWarning);
    }

    emit('created', project);
    emit('close');
  } catch (err) {
    if (err.response?.data?.planLimitReached) {
      // La modale globale "Passez à un forfait supérieur" s'affiche via l'intercepteur api.js.
      // On ferme ce modal de création pour éviter la superposition.
      emit('close');
    } else {
      error.value = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Erreur lors de la création';
    }
  } finally {
    creating.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const { data } = await api.get('/admin/users');
    allUsers.value = data;
  } catch (err) {
    console.error(err);
  }
};

onMounted(async () => {
  await fetchUsers();
  if (auth.user?.id && !form.value.memberIds.includes(auth.user.id)) {
    form.value.memberIds.push(auth.user.id);
  }
});
</script>

<style scoped>
/* --- Améliorations spécifiques à ce modal --- */

.enhanced-modal-backdrop {
  background: rgba(16, 15, 12, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
}

.enhanced-modal {
  max-width: 520px !important;
  border-radius: 16px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15) !important;
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-head {
  padding: 20px 24px !important;
  border-bottom: 1px solid var(--border) !important;
}

.modal-head h3 {
  font-size: 17px !important;
  font-weight: 700 !important;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.01em;
}

.modal-head h3 svg {
  color: var(--accent);
}

.modal-body {
  padding: 24px !important;
}

/* Sélecteur de couleur repensé */
.color-swatches {
  gap: 12px !important;
}

.color-swatch {
  width: 32px !important;
  height: 32px !important;
  border: 2px solid transparent !important;
  box-shadow: 0 0 0 1px var(--border) !important;
  transition: all 0.2s ease !important;
  position: relative;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.selected {
  box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--accent) !important;
  transform: scale(1.1);
}

.color-swatch.selected::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  border: none !important;
  inset: auto !important;
  width: auto !important;
  height: auto !important;
  border-radius: 0 !important;
  background: transparent !important;
}

/* Zone des membres avec scroll si trop long */
.chip-select-container {
  max-height: 140px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
}

.chip-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-toggle {
  transition: all 0.15s ease !important;
  background: var(--surface) !important;
}

.chip-toggle:hover {
  border-color: var(--text-3) !important;
  transform: translateY(-1px);
}

.chip-toggle.selected {
  border-color: var(--accent) !important;
  background: var(--accent-soft) !important;
  color: var(--accent-dark) !important;
  box-shadow: 0 2px 8px rgba(232, 82, 63, 0.15);
}

/* Infobulle repensée */
.field-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px !important;
  padding: 8px 12px;
  background: var(--info-soft);
  border-radius: 6px;
  color: var(--info) !important;
  font-size: 12px;
  font-weight: 500;
}

.field-hint svg {
  flex-shrink: 0;
}

.modal-error-text {
  color: var(--danger);
  font-size: 13px;
  font-weight: 500;
  background: var(--danger-soft);
  padding: 10px 12px;
  border-radius: 8px;
  margin-top: 8px;
}

/* Footer et boutons */
.modal-foot {
  padding: 16px 24px !important;
  border-top: 1px solid var(--border) !important;
}

.btn-primary {
  box-shadow: 0 4px 12px rgba(232, 82, 63, 0.2) !important;
  transition: all 0.2s ease !important;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(232, 82, 63, 0.3) !important;
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

/* Petit scrollbar styling pour la liste des membres */
.chip-select-container::-webkit-scrollbar {
  width: 6px;
}
.chip-select-container::-webkit-scrollbar-track {
  background: transparent;
}
.chip-select-container::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}
.chip-select-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-3);
}
</style>