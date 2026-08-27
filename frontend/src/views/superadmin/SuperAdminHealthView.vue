<template>
  <SuperAdminLayout title="Santé de la plateforme">
    <div class="dashboard-container">
      <div class="panel-grid">
        <!-- Top Actives -->
        <div class="panel">
          <div class="panel-head">
            <h3>Top entreprises actives</h3>
            <span class="panel-tag">30 derniers jours</span>
          </div>

          <div v-if="loadingTop" class="sa-loading">
            <div class="spinner"></div>
            <span>Chargement...</span>
          </div>

          <template v-else>
            <div class="rank-row" v-for="(org, i) in topActive" :key="org.id">
              <span class="rank-badge" :class="`rank-${i + 1}`">{{ i + 1 }}</span>
              <router-link :to="`/super-admin/organizations/${org.id}`" class="rank-name">{{ org.name }}</router-link>
              <span class="rank-count">{{ org.recent_tasks_count }} tâche(s)</span>
            </div>
            <div v-if="topActive.length === 0" class="sa-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Aucune activité récente.</span>
            </div>
          </template>
        </div>

        <!-- Inactives -->
        <div class="panel">
          <div class="panel-head">
            <h3>Entreprises inactives</h3>
            <span class="panel-tag tag-warning">30+ jours</span>
          </div>

          <div v-if="loadingInactive" class="sa-loading">
            <div class="spinner"></div>
            <span>Chargement...</span>
          </div>

          <template v-else>
            <div class="rank-row" v-for="org in inactive" :key="org.id">
              <div class="warn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <router-link :to="`/super-admin/organizations/${org.id}`" class="rank-name">{{ org.name }}</router-link>
              <span class="rank-count muted">
                {{ org.last_activity ? `depuis le ${formatDate(org.last_activity)}` : 'aucune activité' }}
              </span>
            </div>
            <div v-if="inactive.length === 0" class="sa-empty success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Toutes les entreprises sont actives !</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </SuperAdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSuperAdminStore } from '../../stores/superAdmin';
import SuperAdminLayout from '../../components/templates/SuperAdminLayout.vue';

const store = useSuperAdminStore();
const topActive = ref([]);
const inactive = ref([]);
const loadingTop = ref(true);
const loadingInactive = ref(true);

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

onMounted(async () => {
  try {
    topActive.value = await store.fetchTopActiveOrganizations();
  } finally {
    loadingTop.value = false;
  }
  try {
    inactive.value = await store.fetchInactiveOrganizations();
  } finally {
    loadingInactive.value = false;
  }
});
</script>

<style scoped>
/* Variables pour les ombres et animations */
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

.panel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.panel {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.3s ease;
}

.panel:hover {
  box-shadow: var(--shadow-md);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: var(--text, #1a1a1a);
}

.panel-tag {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent, #e8523f);
  background: var(--accent-soft, #fdece8);
  padding: 4px 8px;
  border-radius: 6px;
}

.panel-tag.tag-warning {
  color: #9a6c00;
  background: #fdf8e7;
}

/* Lignes de classement */
.rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  transition: background 0.2s ease;
}

.rank-row:hover {
  background: var(--hover, #f8f9fa);
}

/* Badge pour le top actif */
.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: var(--hover, #f3f1ee);
  color: var(--text-2, #666);
  flex-shrink: 0;
}

.rank-1 { background: #fdece8; color: #e8523f; } /* Or/Orange */
.rank-2 { background: #e8f0fd; color: #3f6fe8; } /* Argent/Bleu */
.rank-3 { background: #e8fdf0; color: #2fa85a; } /* Bronze/Vert */

.warn-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9a6c00;
  flex-shrink: 0;
}

.rank-name {
  flex: 1;
  color: var(--text, #1a1a1a);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.rank-name:hover { 
  color: var(--accent, #e8523f); 
}

.rank-count {
  color: var(--text-2, #666);
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
}

.rank-count.muted { 
  color: var(--text-3, #999); 
}

/* États de chargement et vide */
.sa-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  color: var(--text-3, #999);
  font-size: 13px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(232, 82, 63, 0.2);
  border-radius: 50%;
  border-top-color: var(--accent, #e8523f);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.sa-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
  color: var(--text-3, #999);
  font-size: 13px;
  text-align: center;
}

.sa-empty.success {
  color: #2fa85a;
}

/* Responsive */
@media (max-width: 1000px) {
  .panel-grid { 
    grid-template-columns: 1fr; 
  }
}
</style>