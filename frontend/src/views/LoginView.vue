<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="brand">
        <div class="brand-mark">T</div>
        <div class="brand-name">Task Manager</div>
      </div>
      <h1>Content de vous revoir</h1>
      <p class="sub">Connectez-vous pour retrouver vos projets et vos tâches.</p>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label>Adresse e-mail</label>
          <input v-model="email" type="email" placeholder="vous@entreprise.com" required />
        </div>
        <div class="field">
          <label>Mot de passe</label>
          <input v-model="password" type="password" placeholder="••••••••" required />
        </div>

        <p v-if="error" style="color:var(--danger); font-size:13px; margin-bottom:10px;">{{ error }}</p>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const auth = useAuthStore();
const router = useRouter();

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push('/projects');
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur de connexion';
  } finally {
    loading.value = false;
  }
};
</script>