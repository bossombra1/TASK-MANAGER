<template>
  <AppLayout title="Utilisateurs">
    <div class="page-head enhanced-head">
      <div>
        <h1>Utilisateurs</h1>
        <p>Gérez les membres de votre organisation ({{ users.length }} au total)</p>
      </div>
      <Button class="btn btn-primary btn-add-saas" style="width:auto" @click="showModal = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouvel utilisateur
      </Button>
    </div>

    <!-- Barre de recherche locale -->
    <div class="search-bar-wrapper">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input v-model="searchQuery" type="text" placeholder="Rechercher par nom ou email..." class="search-input" />
    </div>

    <div class="user-list-container">
      <!-- Squelette de chargement -->
      <div v-if="loading" class="user-list">
        <div v-for="i in 4" :key="i" class="member-row sk-row">
          <div class="sk-avatar"></div>
          <div class="sk-info">
            <div class="sk-line w-40"></div>
            <div class="sk-line w-60"></div>
          </div>
          <div class="sk-badge"></div>
          <div class="sk-pill"></div>
        </div>
      </div>

      <!-- État vide -->
      <div v-else-if="filteredUsers.length === 0" class="empty-state-sa">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <h3>Aucun utilisateur trouvé</h3>
        <p v-if="searchQuery">Aucun résultat pour "{{ searchQuery }}".</p>
        <p v-else>Commencez par ajouter votre premier membre.</p>
      </div>

      <!-- Liste des utilisateurs -->
      <TransitionGroup v-else name="list" tag="div" class="user-list">
        <div v-for="user in filteredUsers" :key="user.id" class="member-row">
          <Avatar :user-id="user.id" :nom="user.nom" :avatar-url="user.avatar_url" :size="40" />
          <div class="info">
            <div class="name">{{ user.nom }}</div>
            <div class="email">{{ user.email }}</div>
          </div>
          <Badge :class="user.is_active ? 'badge-done' : 'badge-low'" class="status-badge">
            {{ user.is_active ? 'Actif' : 'Inactif' }}
          </Badge>
          <span class="role-pill" :class="{ owner: user.role === 'admin' }">
            {{ user.role === 'admin' ? 'Administrateur' : 'Membre' }}
          </span>
        </div>
      </TransitionGroup>
    </div>

    <!-- Modale: Nouvel utilisateur -->
    <Transition name="modal-anim">
      <div v-if="showModal" class="modal-backdrop enhanced-backdrop" @click.self="closeModal">
        <div class="modal enhanced-modal">
          <div class="modal-head">
            <h3>Nouvel utilisateur</h3>
            <button class="modal-close" @click="closeModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          
          <div class="modal-body">
            <FormField label="Nom complet">
              <Input type="text" v-model="form.nom" placeholder="Ex : Awa Koffi" />
            </FormField>
            <FormField label="Adresse e-mail">
              <Input type="email" v-model="form.email" placeholder="ex: awa.koffi@taskly.io" />
            </FormField>
            <FormField label="Mot de passe">
              <Input type="password" v-model="form.password" placeholder="8 caractères minimum" />
              <template #hint>
                <div class="field-hint" :style="form.password && form.password.length < 8 ? 'color:var(--danger);' : ''">
                  {{ form.password.length }}/8 caractères minimum
                </div>
              </template>
            </FormField>
            
            <div class="form-group" style="margin-bottom:0;">
              <label>Rôle</label>
              <div class="segmented">
                <button type="button" :class="{ selected: form.role === 'user' }" @click="form.role = 'user'">Membre</button>
                <button type="button" :class="{ selected: form.role === 'admin' }" @click="form.role = 'admin'">Administrateur</button>
              </div>
            </div>
            
            <p v-if="error" class="modal-error-text">{{ error }}</p>
          </div>

          <div class="modal-foot">
            <Button class="btn btn-ghost" @click="closeModal">Annuler</Button>
            <Button class="btn btn-primary" style="width:auto;" :disabled="creating" @click="handleCreate">
              {{ creating ? 'Création...' : "Créer l'utilisateur" }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AppLayout from '../components/templates/AppLayout.vue';
import Avatar from '../components/atoms/Avatar.vue';
import api from '../services/api';
import Button from '../components/atoms/Button.vue';
import Badge from '../components/atoms/Badge.vue';
import Input from '../components/atoms/Input.vue';
import FormField from '../components/molecules/FormField.vue';
import { useToastStore } from '../stores/toast';

const users = ref([]);
const loading = ref(true);
const showModal = ref(false);
const creating = ref(false);
const error = ref('');
const searchQuery = ref('');

const form = ref({ nom: '', email: '', password: '', role: 'user' });

const toast = useToastStore();

// Filtre local pour la recherche instantanée
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const q = searchQuery.value.toLowerCase();
  return users.value.filter(u => 
    u.nom.toLowerCase().includes(q) || 
    u.email.toLowerCase().includes(q)
  );
});

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
    const { data } = await api.post('/admin/users', form.value);

    if (data.planWarning) {
      toast.show(data.planWarning);
    }

    form.value = { nom: '', email: '', password: '', role: 'user' };
    showModal.value = false;
    await fetchUsers();
  } catch (err) {
    if (err.response?.data?.planLimitReached) {
      // La modale globale de plan s'occupe de l'alerte, on ferme juste celle-ci
      showModal.value = false;
    } else {
      error.value = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Erreur lors de la création';
    }
  } finally {
    creating.value = false;
  }
};

onMounted(fetchUsers);
</script>

<style scoped>
/* --- En-tête & Bouton --- */
.enhanced-head {
  margin-bottom: 24px;
}

.enhanced-head h1 {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.enhanced-head p {
  font-size: 14px;
  color: var(--text-2);
}

.btn-add-saas {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px !important;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(232, 82, 63, 0.2);
  transition: all 0.2s ease;
}

.btn-add-saas:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(232, 82, 63, 0.3);
}

/* --- Barre de recherche --- */
.search-bar-wrapper {
  position: relative;
  margin-bottom: 20px;
  max-width: 400px;
}

.search-bar-wrapper svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 11px 14px 11px 40px;
  border-radius: 10px;
  border: 1px solid var(--border, #eee);
  font-size: 13.5px;
  background: var(--surface, #fff);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent, #e8523f);
  box-shadow: 0 0 0 3px var(--accent-soft, #fdece8);
}

/* --- Carte conteneur de la liste --- */
.user-list-container {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Lignes des membres --- */
.member-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border, #f0eee9);
  transition: background 0.15s;
}

.member-row:hover {
  background: var(--surface-2, #f8f9fa);
}

.member-row:last-child {
  border-bottom: none;
}

.member-row .info {
  flex: 1;
  min-width: 0;
}

.member-row .name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-1, #1a1a1a);
}

.member-row .email {
  font-size: 13px;
  color: var(--text-2, #555);
}

.status-badge {
  margin-right: 8px;
}

.role-pill {
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 11px;
  border-radius: 20px;
  background: var(--surface-2, #f3f1ee);
  color: var(--text-2, #666);
}

.role-pill.owner {
  background: var(--accent-soft, #fdece8);
  color: var(--accent-dark, #c63f2e);
}

/* --- Squelettes de chargement --- */
.sk-row {
  padding: 16px 20px;
}

.sk-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--surface-2, #f3f1ee);
  flex-shrink: 0;
}

.sk-info {
  flex: 1;
}

.sk-line {
  height: 10px;
  border-radius: 4px;
  background: var(--surface-2, #f3f1ee);
  margin-bottom: 6px;
}

.sk-badge {
  width: 50px;
  height: 20px;
  border-radius: 20px;
  background: var(--surface-2, #f3f1ee);
  margin-right: 8px;
}

.sk-pill {
  width: 90px;
  height: 22px;
  border-radius: 20px;
  background: var(--surface-2, #f3f1ee);
}

.w-40 { width: 40%; }
.w-60 { width: 60%; }

.skeleton-wrapper > *, .sk-row > * {
  position: relative;
  overflow: hidden;
}

.sk-row > *::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer { 100% { transform: translateX(100%); } }

/* --- État vide --- */
.empty-state-sa {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-3, #999);
}

.empty-state-sa svg {
  margin-bottom: 16px;
  color: var(--text-3, #ccc);
}

.empty-state-sa h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-1, #1a1a1a);
  margin-bottom: 6px;
}

.empty-state-sa p {
  font-size: 13px;
}

/* --- Modale --- */
.enhanced-backdrop {
  background: rgba(16, 15, 12, 0.6) !important;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
}

.enhanced-modal {
  max-width: 500px !important;
  border-radius: 16px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15) !important;
}

.modal-head {
  padding: 20px 24px !important;
  border-bottom: 1px solid var(--border) !important;
}

.modal-head h3 {
  font-size: 17px !important;
  font-weight: 700 !important;
}

.modal-body { padding: 24px !important; }

.modal-error-text {
  color: var(--danger);
  font-size: 13px;
  font-weight: 500;
  background: var(--danger-soft);
  padding: 10px 12px;
  border-radius: 8px;
  margin-top: 12px;
}

.modal-foot {
  padding: 16px 24px !important;
  border-top: 1px solid var(--border) !important;
}

/* Animations Modale */
.modal-anim-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-anim-leave-active { transition: all 0.2s ease; }
.modal-anim-enter-from, .modal-anim-leave-to { opacity: 0; }
.modal-anim-enter-from .modal, .modal-anim-leave-to .modal { transform: translateY(20px) scale(0.95); opacity: 0; }

/* Animation liste */
.list-enter-active, .list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>