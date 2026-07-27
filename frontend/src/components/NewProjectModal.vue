<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-head">
        <h3>Nouveau projet</h3>
        <button class="modal-close" @click="$emit('close')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>Nom du projet</label>
          <input type="text" v-model="form.title" placeholder="Ex : Refonte site web" />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" placeholder="En une phrase, à quoi sert ce projet ?"></textarea>
        </div>

        <div class="form-group">
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

        <div class="form-group">
          <label>Membres du projet</label>
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
          <div class="field-hint">Vous pourrez ajouter d'autres membres après la création.</div>
        </div>

        <p v-if="error" style="color:var(--danger); font-size:12.5px;">{{ error }}</p>
      </div>

      <div class="modal-foot">
        <button class="btn btn-ghost" @click="$emit('close')">Annuler</button>
        <button class="btn btn-primary" style="width:auto;" :disabled="!form.title.trim() || creating" @click="submit">
          {{ creating ? 'Création...' : 'Créer le projet' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useProjectsStore } from '../stores/projects';
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';
import Avatar from './Avatar.vue';

const emit = defineEmits(['close', 'created']);
const auth = useAuthStore();

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
const projectsStore = useProjectsStore();

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

    emit('created', project);
    emit('close');
  } catch (err) {
    error.value = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Erreur lors de la création';
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