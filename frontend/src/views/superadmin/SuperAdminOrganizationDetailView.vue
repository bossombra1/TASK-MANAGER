<template>
  <SuperAdminLayout :title="data?.organization?.name || 'Entreprise'">
    
    <!-- État de chargement (Skeleton) -->
    <div v-if="loading" class="skeleton-wrapper">
      <div class="sk-header">
        <div class="sk-avatar"></div>
        <div class="sk-info">
          <div class="sk-line w-40" style="height: 24px;"></div>
          <div class="sk-line w-60"></div>
        </div>
        <div class="sk-btn"></div>
      </div>
      <div class="sk-stats">
        <div class="sk-stat-card" v-for="i in 3" :key="i"></div>
      </div>
      <div class="sk-panel">
        <div class="sk-line w-20" style="height: 16px; margin-bottom: 20px;"></div>
        <div class="sk-row" v-for="i in 3" :key="i"></div>
      </div>
    </div>

    <div v-else-if="data" class="dashboard-container">
      <!-- En-tête de l'entreprise -->
      <div class="org-header">
        <div class="org-header-left">
          <div class="org-avatar">
            {{ data.organization.name.charAt(0).toUpperCase() }}
          </div>
          <div class="org-header-info">
            <div class="title-row">
              <h1>{{ data.organization.name }}</h1>
              <Badge :class="data.organization.status === 'active' ? 'badge-done' : 'badge-high'">
                {{ data.organization.status === 'active' ? 'Active' : 'Suspendue' }}
              </Badge>
            </div>
            <div class="meta-row">
              <span class="org-slug">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                {{ data.organization.slug }}
              </span>
              <span class="org-date">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Créée le {{ formatDate(data.organization.created_at) }}
              </span>
            </div>
          </div>
        </div>
        
        <button class="btn-toggle-status" :class="{ danger: data.organization.status === 'active' }" @click="handleToggleStatus">
          <svg v-if="data.organization.status === 'active'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {{ data.organization.status === 'active' ? 'Suspendre' : 'Activer' }}
        </button>
      </div>

      <!-- Cartes Statistiques -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon users"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div class="stat-info">
            <div class="stat-value">{{ data.members.length }}</div>
            <div class="stat-label">Membres</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon projects"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg></div>
          <div class="stat-info">
            <div class="stat-value">{{ data.projects.length }}</div>
            <div class="stat-label">Projets</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon tasks"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
          <div class="stat-info">
            <div class="stat-value">{{ totalTasks }}</div>
            <div class="stat-label">Tâches</div>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Panneau Membres -->
        <div class="panel">
          <div class="panel-head">
            <h3>Membres de l'équipe</h3>
            <span class="count-badge">{{ data.members.length }}</span>
          </div>
          
          <div v-if="data.members.length > 0">
            <div class="member-row" v-for="m in data.members" :key="m.id">
              <Avatar :nom="m.nom" :avatar-url="m.avatar_url" :size="36" />
              <div class="member-info">
                <span class="member-name">{{ m.nom }}</span>
                <span class="member-email">{{ m.email }}</span>
              </div>
              <Badge :class="m.role === 'admin' ? 'badge-high' : 'badge-low'">
                {{ m.role === 'admin' ? 'Administrateur' : 'Membre' }}
              </Badge>
              <span class="member-status" :class="{ active: m.is_active !== false, inactive: m.is_active === false }">
                {{ m.is_active === false ? 'Inactif' : 'Actif' }}
              </span>
            </div>
          </div>
          <div v-else class="empty-mini">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <p>Aucun membre enregistré.</p>
          </div>
        </div>

        <!-- Panneau Projets -->
        <div class="panel">
          <div class="panel-head">
            <h3>Projets actifs</h3>
            <span class="count-badge">{{ data.projects.length }}</span>
          </div>

          <div v-if="data.projects.length > 0">
            <div class="project-row" v-for="p in data.projects" :key="p.id">
              <div class="project-dot" :style="{ background: p.color || '#E8523F' }"></div>
              <span class="project-title">{{ p.title }}</span>
              <span class="project-tasks">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
                {{ p.tasks_count }} tâche(s)
              </span>
              <span class="project-date">{{ formatDate(p.created_at) }}</span>
            </div>
          </div>
          <div v-else class="empty-mini">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/></svg>
            <p>Aucun projet créé.</p>
          </div>
        </div>
      </div>
    </div>
  </SuperAdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSuperAdminStore } from '../../stores/superAdmin';
import SuperAdminLayout from '../../components/templates/SuperAdminLayout.vue';
import Badge from '../../components/atoms/Badge.vue';
import Avatar from '../../components/atoms/Avatar.vue';

const route = useRoute();
const store = useSuperAdminStore();
const loading = ref(true);
const data = ref(null);

const totalTasks = computed(() => data.value?.projects.reduce((sum, p) => sum + Number(p.tasks_count), 0) || 0);

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const handleToggleStatus = async () => {
  try {
    const updated = await store.toggleOrganizationStatus(data.value.organization.id);
    data.value.organization.status = updated.status;
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || 'Erreur lors du changement de statut');
  }
};

onMounted(async () => {
  try {
    data.value = await store.fetchOrganizationById(route.params.id);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* Variables */
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
}

.dashboard-container {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- En-tête Entreprise --- */
.org-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 20px;
  flex-wrap: wrap;
}

.org-header-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.org-avatar {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--accent, #e8523f), var(--accent-dark, #c63f2e));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 8px 16px rgba(232, 82, 63, 0.2);
}

.org-header-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.org-header h1 {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
}

.org-slug, .org-date {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3, #999);
}

.btn-toggle-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid var(--border, #eee);
  background: var(--surface, #fff);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--success, #2fa85a);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle-status:hover {
  background: var(--success-soft, #e6f6ea);
  border-color: var(--success, #2fa85a);
}

.btn-toggle-status.danger {
  color: var(--danger, #d9463a);
}

.btn-toggle-status.danger:hover {
  background: var(--danger-soft, #fdeceb);
  border-color: var(--danger, #d9463a);
}

/* --- Cartes Stats --- */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.users { background: linear-gradient(135deg, #f5e8fd, #efdff9); color: #9b3fe8; }
.stat-icon.projects { background: linear-gradient(135deg, #e8f0fd, #dfe7fb); color: #3f6fe8; }
.stat-icon.tasks { background: linear-gradient(135deg, #e8fdf0, #d8f5e4); color: #2fa85a; }

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text, #1a1a1a);
  line-height: 1.1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-3, #999);
  margin-top: 2px;
}

/* --- Grille Contenu --- */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* --- Panneaux --- */
.panel {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: var(--text, #1a1a1a);
}

.count-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-2, #555);
  background: var(--surface-2, #f3f1ee);
  padding: 3px 8px;
  border-radius: 10px;
}

/* Lignes Membres */
.member-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border, #f0eee9);
}

.member-row:last-child {
  border-bottom: none;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text, #1a1a1a);
}

.member-email {
  font-size: 12px;
  color: var(--text-3, #999);
}

.member-status {
  font-size: 12px;
  font-weight: 600;
  width: 60px;
  text-align: right;
}

.member-status.active { color: var(--success, #2fa85a); }
.member-status.inactive { color: var(--text-3, #999); }

/* Lignes Projets */
.project-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border, #f0eee9);
}

.project-row:last-child {
  border-bottom: none;
}

.project-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.project-title {
  flex: 1;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text, #1a1a1a);
}

.project-tasks {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--text-2, #555);
}

.project-date {
  font-size: 12px;
  color: var(--text-3, #999);
  width: 80px;
  text-align: right;
}

/* --- Empty States --- */
.empty-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 30px 0;
  color: var(--text-3, #999);
}

.empty-mini svg {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-mini p {
  font-size: 13px;
  margin: 0;
}

/* --- Squelettes de chargement --- */
.skeleton-wrapper {
  padding-top: 10px;
}

.sk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.sk-avatar {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: var(--surface-2, #f3f1ee);
}

.sk-info {
  flex: 1;
  margin-left: 18px;
}

.sk-line {
  height: 12px;
  border-radius: 4px;
  background: var(--surface-2, #f3f1ee);
  margin-bottom: 8px;
}

.sk-btn {
  width: 120px;
  height: 40px;
  border-radius: 10px;
  background: var(--surface-2, #f3f1ee);
}

.sk-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.sk-stat-card {
  height: 84px;
  border-radius: 16px;
  background: var(--surface-2, #f3f1ee);
}

.sk-panel {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 16px;
  padding: 24px;
}

.sk-row {
  height: 40px;
  border-bottom: 1px solid var(--border, #f0eee9);
  margin-bottom: 8px;
  background: var(--surface-2, #f3f1ee);
  border-radius: 8px;
}

/* Animation brillance */
.skeleton-wrapper > * {
  position: relative;
  overflow: hidden;
}

.skeleton-wrapper > *::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer { 100% { transform: translateX(100%); } }

.w-20 { width: 20%; }
.w-40 { width: 40%; }
.w-60 { width: 60%; }

/* Responsive */
@media (max-width: 1000px) {
  .content-grid { grid-template-columns: 1fr; }
  .stat-grid { grid-template-columns: 1fr; }
}
</style>