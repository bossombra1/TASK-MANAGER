<template>
  <AppLayout title="Mon profil">
    <div class="page-head">
      <div>
        <h1>Mon profil</h1>
        <p>Gérez vos informations personnelles et vos préférences</p>
      </div>
    </div>

    <div class="profile-head">
      <div class="profile-avatar" :style="{ background: colorFor(auth.user?.id) }">
        <img v-if="avatarSrc" :src="avatarSrc" alt="" />
        <span v-else>{{ initials(auth.user?.nom) }}</span>
      </div>
      <div>
        <h2>{{ auth.user?.nom }}</h2>
        <div class="role">{{ auth.isAdmin ? 'Administrateur' : 'Membre' }}</div>
        <div class="email">{{ auth.user?.email }}</div>
      </div>
      <Button class="btn btn-ghost" style="width:auto;" @click="triggerFileInput" :disabled="uploadingAvatar">
        {{ uploadingAvatar ? 'Envoi...' : 'Changer la photo' }}
      </Button>
      <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" style="display:none" @change="handleFileChange" />
    </div>
    <p v-if="avatarError" style="color:var(--danger); font-size:12.5px; margin-top:-14px; margin-bottom:16px;">{{ avatarError }}</p>

    <div class="settings-card">
      <h3>Informations personnelles</h3>
      <form @submit.prevent="handleSaveProfile">
        <div class="form-row">
          <FormField label="Nom complet">
            <Input type="text" v-model="profileForm.nom" required />
          </FormField>
          <FormField label="Adresse e-mail">
            <Input type="email" v-model="profileForm.email" required />
          </FormField>
        </div>
        <p v-if="profileError" style="color:var(--danger); font-size:12.5px; margin-top:8px;">{{ profileError }}</p>
        <p v-if="profileSuccess" style="color:var(--success); font-size:12.5px; margin-top:8px;">{{ profileSuccess }}</p>
        <div class="settings-foot">
          <Button type="submit" class="btn btn-primary" style="width:auto;" :disabled="savingProfile">
            {{ savingProfile ? 'Enregistrement...' : 'Enregistrer' }}
          </Button>
        </div>
      </form>
    </div>

    <div class="settings-card">
      <h3>Sécurité — changer le mot de passe</h3>
      <form @submit.prevent="handleChangePassword">
        <FormField label="Mot de passe actuel">
          <Input type="password" v-model="passwordForm.current" placeholder="••••••••" required />
        </FormField>
        <div class="form-row">
          <FormField label="Nouveau mot de passe">
            <Input type="password" v-model="passwordForm.next" placeholder="8 caractères minimum" required minlength="8" />
          </FormField>
          <FormField label="Confirmer le mot de passe">
            <Input type="password" v-model="passwordForm.confirm" placeholder="••••••••" required />
          </FormField>
        </div>
        <p v-if="passwordError" style="color:var(--danger); font-size:12.5px; margin-top:8px;">{{ passwordError }}</p>
        <p v-if="passwordSuccess" style="color:var(--success); font-size:12.5px; margin-top:8px;">{{ passwordSuccess }}</p>
        <div class="settings-foot">
          <Button type="submit" class="btn btn-primary" style="width:auto;" :disabled="savingPassword">
            {{ savingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe' }}
          </Button>
        </div>
      </form>
    </div>

    <div class="settings-card">
      <h3>Session</h3>
      <p style="font-size:13px; color:var(--text-2); margin-bottom:14px;">
        Vous êtes connecté avec {{ auth.user?.email }}.
      </p>
        <div class="settings-foot" style="justify-content:flex-start;">
        <Button class="btn btn-ghost" style="width:auto;" @click="handleLogout">Se déconnecter</Button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/templates/AppLayout.vue';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';
import { colorFor, initials } from '../utils/colors';
import { resolveAssetUrl } from '../utils/assets';
import Button from '../components/atoms/Button.vue';
import Input from '../components/atoms/Input.vue';
import FormField from '../components/molecules/FormField.vue';

const auth = useAuthStore();

// ---------- Avatar ----------
const avatarSrc = ref(resolveAssetUrl(auth.user?.avatar_url));
const uploadingAvatar = ref(false);
const avatarError = ref('');
const fileInput = ref(null);

const triggerFileInput = () => fileInput.value?.click();

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  avatarError.value = '';
  uploadingAvatar.value = true;
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    avatarSrc.value = resolveAssetUrl(data.avatar_url);
    auth.updateUser({ avatar_url: data.avatar_url });
  } catch (err) {
    avatarError.value = err.response?.data?.message || "Erreur lors de l'envoi de la photo";
  } finally {
    uploadingAvatar.value = false;
    e.target.value = '';
  }
};

// ---------- Infos personnelles ----------
const profileForm = ref({
  nom: auth.user?.nom || '',
  email: auth.user?.email || '',
});
const profileError = ref('');
const profileSuccess = ref('');
const savingProfile = ref(false);

const handleSaveProfile = async () => {
  profileError.value = '';
  profileSuccess.value = '';
  savingProfile.value = true;
  try {
    const { data } = await api.put('/auth/me', {
      nom: profileForm.value.nom,
      email: profileForm.value.email,
    });
    auth.updateUser(data.user);
    profileSuccess.value = 'Profil mis à jour avec succès';
  } catch (err) {
    profileError.value = err.response?.data?.message || 'Erreur lors de la mise à jour du profil';
  } finally {
    savingProfile.value = false;
  }
};

// ---------- Mot de passe ----------
const passwordForm = ref({ current: '', next: '', confirm: '' });
const passwordError = ref('');
const passwordSuccess = ref('');
const savingPassword = ref(false);

const handleChangePassword = async () => {
  passwordError.value = '';
  passwordSuccess.value = '';
  if (passwordForm.value.next !== passwordForm.value.confirm) {
    passwordError.value = 'Les mots de passe ne correspondent pas';
    return;
  }
  savingPassword.value = true;
  try {
    await api.put('/auth/change-password', {
      currentPassword: passwordForm.value.current,
      newPassword: passwordForm.value.next,
    });
    passwordSuccess.value = 'Mot de passe mis à jour avec succès';
    passwordForm.value = { current: '', next: '', confirm: '' };
  } catch (err) {
    passwordError.value = err.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe';
  } finally {
    savingPassword.value = false;
  }
};

// ---------- Session ----------
const router = useRouter();
const handleLogout = () => {
  auth.logout();
  router.push('/login');
};
</script>
