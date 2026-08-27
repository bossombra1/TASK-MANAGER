<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="brand">
        <div class="brand-mark">T</div>
        <div class="brand-name">Task Manager</div>
      </div>
      <h1>Créer votre organisation</h1>
      <p class="sub">Inscrivez votre entreprise et devenez administrateur de votre espace.</p>

      <form @submit.prevent="handleSubmit">
        <FormField label="Nom de l'organisation">
          <Input v-model="organizationName" type="text" placeholder="Mon Entreprise" required />
        </FormField>
        <FormField label="Votre nom">
          <Input v-model="nom" type="text" placeholder="Regis Kouame" required />
        </FormField>
        <FormField label="Adresse e-mail">
          <Input v-model="email" type="email" placeholder="vous@entreprise.com" required />
        </FormField>
        <FormField label="Mot de passe">
          <Input v-model="password" type="password" placeholder="••••••••" required minlength="8" />
        </FormField>

        <p v-if="error" style="color:var(--danger); font-size:13px; margin-bottom:10px;">{{ error }}</p>

        <Button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Création...' : 'Créer mon organisation' }}
        </Button>
      </form>

      <p class="sub" style="margin-top:16px; text-align:center;">
        Déjà un compte ?
        <router-link to="/login">Se connecter</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Button from '../components/atoms/Button.vue';
import Input from '../components/atoms/Input.vue';
import FormField from '../components/molecules/FormField.vue';

const organizationName = ref('');
const nom = ref('');
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
    await auth.register(organizationName.value, nom.value, email.value, password.value);
    router.push('/projects');
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de la création du compte';
  } finally {
    loading.value = false;
  }
};
</script>
