<template>
  <AppLayout title="Utilisateurs">
    <div class="page-head">
      <div>
        <h1>Utilisateurs</h1>
        <p>{{ users.length }} compte{{ users.length > 1 ? 's' : '' }} dans le système</p>
      </div>
      <button class="btn btn-primary btn-add" style="width:auto" @click="showModal = true">
        + Nouvel utilisateur
      </button>
    </div>

    <p v-if="loading" style="color:var(--text-2); font-size:13px;">Chargement...</p>

    <div v-else v-for="user in users" :key="user.id" class="member-row">
      <Avatar :user-id="user.id" :nom="user.nom" :avatar-url="user.avatar_url" :size="38" />
      <div class="info">
        <div class="name">{{ user.nom }}</div>
        <div class="email">{{ user.email }}</div>
      </div>
      <span class="badge" :class="user.is_active ? 'badge-done' : 'badge-low'" style="margin-right:8px;">
        {{ user.is_active ? 'Actif' : 'Inactif' }}
      </span>
      <span class="role-pill" :class="{ owner: user.role === 'admin' }">
        {{ user.role === 'admin' ? 'Administrateur' : 'Membre' }}
      </span>
    </div>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <div class="modal-head">
          <h3>Nouvel utilisateur</h3>
          <button class="modal-close" @click="closeModal">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nom complet</label>
            <input type="text" v-model="form.nom" placeholder="Ex : Awa Koffi" />
          </div>
          <div class="form-group">
            <label>Adresse e-mail</label>
            <input type="email" v-model="form.email" placeholder="ex: awa.koffi@taskly.io" />
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input type="password" v-model="form.password" placeholder="8 caractères minimum" />
            <div class="field-hint" :style="form.password && form.password.length < 8 ? 'color:var(--danger);' : ''">
              {{ form.password.length }}/8 caractères minimum
            </div>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label>Rôle</label>
            <div class="segmented">
              <button type="button" :class="{ selected: form.role === 'user' }" @click="form.role = 'user'">Membre</button>
              <button type="button" :class="{ selected: form.role === 'admin' }" @click="form.role = 'admin'">Administrateur</button>
            </div>
          </div>
          <p v-if="error" style="color:var(--danger); font-size:12.5px; margin-top:12px;">{{ error }}</p>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" @click="closeModal">Annuler</button>
          <button class="btn btn-primary" style="width:auto;" :disabled="creating" @click="handleCreate">
            {{ creating ? 'Création...' : "Créer l'utilisateur" }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../components/AppLayout.vue';
import Avatar from '../components/Avatar.vue';
import api from '../services/api';

const users = ref([]);
const loading = ref(true);
const showModal = ref(false);
const creating = ref(false);
const error = ref('');

const form = ref({ nom: '', email: '', password: '', role: 'user' });

// const canSubmit = computed(() =>
//   form.value.nom.trim() && form.value.email.trim() && form.value.password.length >= 8
// );

const fetchUsers = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/users');
    users.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  error.value = '';
};

const handleCreate = async () => {
  error.value = '';
  if (!form.value.nom.trim() || !form.value.email.trim()) {
    error.value = 'Le nom et l\'email sont requis';
    return;
  }
  if (form.value.password.length < 8) {
    error.value = 'Le mot de passe doit contenir au moins 8 caractères';
    return;
  }
  creating.value = true;
  try {
    await api.post('/admin/users', form.value);
    form.value = { nom: '', email: '', password: '', role: 'user' };
    showModal.value = false;
    await fetchUsers();
  } catch (err) {
    error.value = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Erreur lors de la création';
  } finally {
    creating.value = false;
  }
};

onMounted(fetchUsers);
</script>