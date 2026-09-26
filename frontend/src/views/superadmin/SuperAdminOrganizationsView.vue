<template>
  <SuperAdminLayout title="Entreprises">
    <template #actions>
      <Button class="btn btn-primary btn-add-saas" style="width:auto;" @click="showCreateModal = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouvelle entreprise
      </Button>
    </template>
    
    <div class="filters-bar enhanced-filters">
      <div class="search-wrapper">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="search"
          type="text"
          class="search-input"
          placeholder="Rechercher une entreprise..."
          @input="debouncedFetch"
        />
      </div>
      
      <select v-model="statusFilter" @change="fetchList" class="sa-select">
        <option value="">Tous les statuts</option>
        <option value="active">Actives</option>
        <option value="suspended">Suspendues</option>
      </select>
      
      <select v-model="planFilter" @change="fetchList" class="sa-select">
        <option value="">Tous les plans</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="enterprise">Enterprise</option>
      </select>
    </div>

    <!-- État de chargement (Skeletons) -->
    <div v-if="loading" class="org-table">
      <div class="org-row org-row-head">
        <span>Entreprise</span>
        <span>Statut</span>
        <span>Plan</span>
        <span>Membres</span>
        <span>Projets</span>
        <span>Tâches</span>
        <span>Créée le</span>
        <span></span>
      </div>
      <div v-for="i in 6" :key="i" class="org-row sk-row">
        <span><div class="sk-box w-70"></div></span>
        <span><div class="sk-box w-40"></div></span>
        <span><div class="sk-box w-30"></div></span>
        <span><div class="sk-box w-20"></div></span>
        <span><div class="sk-box w-20"></div></span>
        <span><div class="sk-box w-20"></div></span>
        <span><div class="sk-box w-50"></div></span>
        <span><div class="sk-box w-20"></div></span>
      </div>
    </div>

    <!-- Tableau des entreprises -->
    <div v-else class="org-table enhanced-table">
      <div class="org-row org-row-head">
        <span>Entreprise</span>
        <span>Statut</span>
        <span>Plan</span>
        <span>Membres</span>
        <span>Projets</span>
        <span>Tâches</span>
        <span>Créée le</span>
        <span></span>
      </div>

      <div v-for="org in organizations" :key="org.id" class="org-row data-row">
        <span class="org-name">
          <div class="org-icon-wrapper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/></svg>
          </div>
          <router-link :to="`/super-admin/organizations/${org.id}`">{{ org.name }}</router-link>
        </span>
        <span>
          <Badge :class="org.status === 'active' ? 'badge-done' : 'badge-high'">
            {{ org.status === 'active' ? 'Active' : 'Suspendue' }}
          </Badge>
        </span>
        <span>
          <span class="plan-pill" :class="`plan-${org.plan || 'free'}`">{{ planLabel(org.plan) }}</span>
        </span>
        <span class="data-value">{{ org.users_count }}</span>
        <span class="data-value">{{ org.projects_count }}</span>
        <span class="data-value">{{ org.tasks_count }}</span>
        <span class="data-date">{{ formatDate(org.created_at) }}</span>
        <span class="org-actions">
          <div class="dropdown" ref="dropdownRefs">
            <button class="icon-btn" @click.stop="toggleMenu(org.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <Transition name="dropdown">
              <div v-if="openMenuId === org.id" class="dropdown-menu" @click.stop>
                <button @click="handleToggleStatus(org)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                  {{ org.status === 'active' ? 'Suspendre' : 'Activer' }}
                </button>
                <button @click="openPlanModal(org)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  Changer le plan
                </button>
                <div class="dropdown-sep"></div>
                <button class="danger" @click="handleDelete(org)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Supprimer
                </button>
              </div>
            </Transition>
          </div>
        </span>
      </div>

      <div v-if="organizations.length === 0" class="empty-state-sa">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <h3>Aucune entreprise trouvée</h3>
        <p>Essayez de modifier vos filtres de recherche.</p>
      </div>
    </div>

    <!-- Modale : Nouvelle entreprise -->
    <Transition name="modal-anim">
      <div v-if="showCreateModal" class="modal-backdrop enhanced-backdrop" @click.self="showCreateModal = false">
        <div class="modal enhanced-modal">
          <div class="modal-head">
            <h3>Nouvelle entreprise</h3>
            <button class="modal-close" @click="showCreateModal = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="modal-body">
            <FormField label="Nom de l'entreprise">
              <Input v-model="createForm.organizationName" placeholder="Ex : Mon Entreprise" />
            </FormField>
            <FormField label="Nom de l'administrateur">
              <Input v-model="createForm.nom" placeholder="Ex : Regis Kouame" />
            </FormField>
            <FormField label="Email de l'administrateur">
              <Input v-model="createForm.email" type="email" placeholder="admin@taskmanager.com" />
            </FormField>
            <FormField label="Mot de passe">
              <Input v-model="createForm.password" type="password" placeholder="••••••••" />
            </FormField>
            <p v-if="createError" class="modal-error-text">{{ createError }}</p>
          </div>

          <div class="modal-foot">
            <Button class="btn btn-ghost" @click="showCreateModal = false">Annuler</Button>
            <Button class="btn btn-primary" style="width:auto;" :disabled="creating" @click="handleCreateOrganization">
              {{ creating ? 'Création...' : 'Créer l\'entreprise' }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modale : Changer le plan -->
    <Transition name="modal-anim">
      <div v-if="showPlanModal" class="modal-backdrop enhanced-backdrop" @click.self="closePlanModal">
        <div class="modal enhanced-modal">
          <div class="modal-head">
            <h3>Changer le plan</h3>
            <button class="modal-close" @click="closePlanModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="modal-body">
            <p style="font-size:13px; color:var(--text-2); margin:0 0 14px;">{{ planTarget?.name }}</p>
            <div class="form-group" style="margin-bottom:0;">
              <label>Forfait</label>
              <select v-model="selectedPlan" class="sa-select w-full">
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <p v-if="planError" class="modal-error-text" style="margin-top:12px;">{{ planError }}</p>
          </div>

          <div class="modal-foot">
            <Button class="btn btn-ghost" @click="closePlanModal">Annuler</Button>
            <Button class="btn btn-primary" style="width:auto;" :disabled="changingPlan" @click="handleChangePlan">
              {{ changingPlan ? 'Modification...' : 'Confirmer' }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </SuperAdminLayout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useSuperAdminStore } from '../../stores/superAdmin';
import SuperAdminLayout from '../../components/templates/SuperAdminLayout.vue';
import Badge from '../../components/atoms/Badge.vue';

import Input from '../../components/atoms/Input.vue';
import FormField from '../../components/molecules/FormField.vue';

const store = useSuperAdminStore();
const organizations = ref([]);
const loading = ref(true);
const search = ref('');
const statusFilter = ref('');
const planFilter = ref('');

const openMenuId = ref(null);

const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref('');
const createForm = ref({ organizationName: '', nom: '', email: '', password: '' });

const showPlanModal = ref(false);
const planTarget = ref(null);
const selectedPlan = ref('free');
const changingPlan = ref(false);
const planError = ref('');

let debounceTimer = null;
const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchList, 350);
};

const handleCreateOrganization = async () => {
  createError.value = '';
  if (!createForm.value.organizationName.trim() || !createForm.value.nom.trim() || !createForm.value.email.trim() || !createForm.value.password) {
    createError.value = 'Tous les champs sont requis';
    return;
  }
  creating.value = true;
  try {
    await store.createOrganization({ ...createForm.value });
    showCreateModal.value = false;
    createForm.value = { organizationName: '', nom: '', email: '', password: '' };
    fetchList(); 
  } catch (err) {
    createError.value = err.response?.data?.message || 'Erreur lors de la création';
  } finally {
    creating.value = false;
  }
};

const fetchList = async () => {
  loading.value = true;
  try {
    organizations.value = await store.fetchOrganizations({
      search: search.value || undefined,
      status: statusFilter.value || undefined,
      plan: planFilter.value || undefined,
    });
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const toggleMenu = (id) => {
  openMenuId.value = openMenuId.value === id ? null : id;
};

const closeMenu = () => {
  openMenuId.value = null;
};

const handleDocumentClick = () => {
  closeMenu();
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  fetchList();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});

const handleToggleStatus = async (org) => {
  closeMenu();
  try {
    await store.toggleOrganizationStatus(org.id);
    org.status = org.status === 'active' ? 'suspended' : 'active';
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || 'Erreur lors du changement de statut');
  }
};

const handleDelete = async (org) => {
  closeMenu();
  if (!confirm(`Supprimer définitivement "${org.name}" ? Cette action supprimera aussi tous ses projets, tâches et utilisateurs.`)) return;
  try {
    await store.deleteOrganization(org.id);
    organizations.value = organizations.value.filter((o) => o.id !== org.id);
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || 'Erreur lors de la suppression');
  }
};

const planLabel = (plan) => {
  if (plan === 'pro') return 'Pro';
  if (plan === 'enterprise') return 'Enterprise';
  return 'Free';
};

const openPlanModal = (org) => {
  closeMenu();
  planTarget.value = org;
  selectedPlan.value = org.plan || 'free';
  planError.value = '';
  showPlanModal.value = true;
};

const closePlanModal = () => {
  showPlanModal.value = false;
  planTarget.value = null;
};

const handleChangePlan = async () => {
  if (!planTarget.value) return;
  changingPlan.value = true;
  planError.value = '';
  try {
    await store.updateOrganizationPlan(planTarget.value.id, selectedPlan.value);
    planTarget.value.plan = selectedPlan.value;
    closePlanModal();
  } catch (err) {
    planError.value = err.response?.data?.message || 'Erreur lors du changement de plan';
  } finally {
    changingPlan.value = false;
  }
};

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
</script>

<style scoped>
/* --- Barre de filtres --- */
.enhanced-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 220px;
  max-width: 320px;
}

.search-wrapper svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 9px 12px 9px 36px !important;
  border-radius: 8px;
  border: 1px solid var(--border, #eee);
  font-size: 13px;
  background: var(--surface, #fff);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent, #e8523f);
  box-shadow: 0 0 0 3px var(--accent-soft, #fdece8);
}

.sa-select {
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--border, #eee);
  font-size: 13px;
  background: var(--surface, #fff);
  cursor: pointer;
  transition: all 0.2s;
}

.sa-select:hover {
  border-color: var(--text-3, #999);
}

.w-full { width: 100%; padding: 9px 12px !important; }

.btn-add-saas {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(232, 82, 63, 0.2);
  transition: all 0.2s ease;
}

.btn-add-saas:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(232, 82, 63, 0.3);
}

/* --- Tableau --- */
.enhanced-table {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.org-row {
  display: grid;
  grid-template-columns: 2fr 0.9fr 0.8fr 0.7fr 0.7fr 0.7fr 1fr 40px;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border, #f0eee9);
  font-size: 13.5px;
  transition: background 0.15s;
}

.data-row:hover {
  background: var(--surface-2, #f8f9fa);
}

.org-row:last-child {
  border-bottom: none;
}

.org-row-head {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3, #999);
  padding: 12px 18px;
  background: var(--surface-2, #f8f9fa);
}

.org-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.org-icon-wrapper {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--surface-2, #f3f1ee);
  color: var(--text-2, #666);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.org-name a {
  color: var(--text-1, #1a1a1a);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.org-name a:hover {
  color: var(--accent, #e8523f);
}

.data-value, .data-date {
  color: var(--text-2, #555);
}

.data-date {
  font-size: 12.5px;
}

/* --- Badges & Pills --- */
.plan-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.plan-pill.plan-free { background: var(--surface-2, #f3f1ee); color: var(--text-2, #666); }
.plan-pill.plan-pro { background: var(--accent-soft, #fdece8); color: var(--accent, #e8523f); }
.plan-pill.plan-enterprise { background: #eaf3ff; color: #3b7ddd; }

/* --- Dropdown Menu --- */
.org-actions {
  display: flex;
  justify-content: flex-end;
  position: relative;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-2, #666);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--surface-2, #f3f1ee);
  color: var(--text-1, #1a1a1a);
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 38px;
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  padding: 6px;
  min-width: 180px;
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.dropdown-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  padding: 8px 10px;
  border: none;
  background: transparent;
  font-size: 13px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-1, #1a1a1a);
  transition: background 0.15s;
}

.dropdown-menu button:hover {
  background: var(--surface-2, #f3f1ee);
}

.dropdown-menu button.danger { color: var(--danger, #d9463a); }
.dropdown-menu button.danger:hover { background: var(--danger-soft, #fdeceb); }

.dropdown-sep {
  height: 1px;
  background: var(--border, #eee);
  margin: 4px 0;
}

/* Animations Dropdown */
.dropdown-enter-active { transition: all 0.2s ease; }
.dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-5px); }

/* --- Squelettes de chargement --- */
.sk-row {
  border-bottom: 1px solid var(--border, #f0eee9);
}
.sk-box {
  height: 14px;
  border-radius: 4px;
  background: var(--surface-2, #f3f1ee);
  position: relative;
  overflow: hidden;
}
.sk-box::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 100% { transform: translateX(100%); } }

.w-70 { width: 70%; }
.w-50 { width: 50%; }
.w-40 { width: 40%; }
.w-30 { width: 30%; }
.w-20 { width: 20%; }

/* --- Empty State --- */
.empty-state-sa {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-3, #999);
}
.empty-state-sa svg { margin-bottom: 16px; color: var(--text-3, #ccc); }
.empty-state-sa h3 { font-size: 16px; font-weight: 700; color: var(--text-1, #1a1a1a); margin-bottom: 6px; }
.empty-state-sa p { font-size: 13px; }

/* --- Modales --- */
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
  display: flex;
  align-items: center;
  letter-spacing: -0.01em;
}

.modal-body { padding: 24px !important; }

.modal-error-text {
  color: var(--danger);
  font-size: 13px;
  font-weight: 500;
  background: var(--danger-soft);
  padding: 10px 12px;
  border-radius: 8px;
  margin-top: 8px;
}

.modal-foot {
  padding: 16px 24px !important;
  border-top: 1px solid var(--border) !important;
}

.modal-anim-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-anim-leave-active { transition: all 0.2s ease; }
.modal-anim-enter-from, .modal-anim-leave-to { opacity: 0; }
.modal-anim-enter-from .modal, .modal-anim-leave-to .modal { transform: translateY(20px) scale(0.95); opacity: 0; }

@media (max-width: 1100px) {
  .org-row { grid-template-columns: 1.6fr 0.9fr 0.7fr 0.6fr 0.6fr 0.6fr 40px; }
  .org-row span:nth-child(7) { display: none; }
}
@media (max-width: 700px) {
  .org-table { overflow-x: auto; }
  .org-row { min-width: 640px; }
}
</style>