<template>
  <AppLayout :title="project ? `Membres — ${project.title}` : 'Membres'">
    <div v-if="loading" style="color:var(--text-2); font-size:13px;">Chargement...</div>

    <template v-else-if="project">
      <div class="page-head">
        <div>
          <h1>Membres du projet</h1>
          <p>{{ project.title }} · {{ members.length }} membre{{ members.length > 1 ? 's' : '' }}</p>
        </div>
        <button v-if="auth.isAdmin" class="btn btn-primary btn-add" style="width:auto" @click="openModal">
          + Ajouter un membre
        </button>
      </div>

      <div v-for="member in members" :key="member.id" class="member-row">
        <Avatar :user-id="member.id" :nom="member.nom" :avatar-url="member.avatar_url" :size="38" />
        <div class="info">
          <div class="name">{{ member.nom }}</div>
          <div class="email">{{ member.email }}</div>
        </div>
        <span class="role-pill" :class="{ owner: member.id === project.created_by }">
          {{ member.id === project.created_by ? 'Propriétaire' : 'Membre' }}
        </span>
      </div>

      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <div class="modal-head">
            <h3>Ajouter un membre</h3>
            <button class="modal-close" @click="closeModal">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group" style="margin-bottom:0;">
              <label>Utilisateur</label>
              <select v-model="selectedUserId">
                <option value="" disabled>Choisir un utilisateur...</option>
                <option v-for="u in availableUsers" :key="u.id" :value="u.id">{{ u.nom }} ({{ u.email }})</option>
              </select>
              <div v-if="availableUsers.length === 0" class="field-hint">
                Tous les utilisateurs existants sont déjà membres de ce projet.
              </div>
              <p v-if="addError" style="color:var(--danger); font-size:12.5px; margin-top:8px;">{{ addError }}</p>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" @click="closeModal">Annuler</button>
            <button class="btn btn-primary" style="width:auto;" :disabled="!selectedUserId || adding" @click="handleAdd">
              {{ adding ? 'Ajout...' : 'Ajouter' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '../components/AppLayout.vue';
import Avatar from '../components/Avatar.vue';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const auth = useAuthStore();

const project = ref(null);
const members = ref([]);
const loading = ref(true);

const showModal = ref(false);
const allUsers = ref([]);
const selectedUserId = ref('');
const adding = ref(false);
const addError = ref('');

const availableUsers = computed(() =>
  allUsers.value.filter((u) => !members.value.some((m) => m.id === u.id))
);

const fetchProject = async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/projects/${route.params.id}`);
    project.value = data;
    members.value = data.members || [];
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const openModal = async () => {
  addError.value = '';
  selectedUserId.value = '';
  showModal.value = true;
  try {
    const { data } = await api.get('/admin/users');
    allUsers.value = data;
  } catch (err) {
    console.error(err);
  }
};

const closeModal = () => { showModal.value = false; };

const handleAdd = async () => {
  if (!selectedUserId.value) return;
  adding.value = true;
  addError.value = '';
  try {
    const { data } = await api.post(`/admin/projects/${route.params.id}/members`, {
      user_id: selectedUserId.value,
    });
    members.value.push(data.member);
    showModal.value = false;
  } catch (err) {
    addError.value = err.response?.data?.message || "Erreur lors de l'ajout";
  } finally {
    adding.value = false;
  }
};

onMounted(fetchProject);
</script>