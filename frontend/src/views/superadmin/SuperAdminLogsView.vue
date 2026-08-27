<template>
  <SuperAdminLayout title="Journal d'activité">
    <div v-if="loading" class="sa-loading">Chargement...</div>

    <div v-else class="log-list">
      <div v-for="log in logs" :key="log.id" class="log-row">
        <div class="log-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3M12 3a9 9 0 100 18 9 9 0 000-18z"/></svg>
        </div>
        <div class="log-body">
          <div class="log-line">
            <b>{{ log.super_admin_nom }}</b> — {{ actionLabel(log.action) }}
            <span v-if="log.target_type"> ({{ log.target_type }})</span>
          </div>
          <div class="log-meta">{{ relativeTime(log.created_at) }}</div>
        </div>
      </div>

      <p v-if="logs.length === 0" class="sa-empty">Aucune activité enregistrée.</p>
    </div>
  </SuperAdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSuperAdminStore } from '../../stores/superAdmin';
import SuperAdminLayout from '../../components/templates/SuperAdminLayout.vue';

const store = useSuperAdminStore();
const logs = ref([]);
const loading = ref(true);

const actionLabel = (action) => ({
  toggle_organization_status: 'a changé le statut d\'une entreprise',
  update_organization_plan: 'a changé le plan d\'une entreprise',
  delete_organization: 'a supprimé une entreprise',
}[action] || action);

const relativeTime = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

onMounted(async () => {
  try {
    logs.value = await store.fetchLogs();
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.log-list {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  border-radius: 12px;
  padding: 8px 20px;
}

.log-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border, #f0eee9);
}

.log-row:last-child {
  border-bottom: none;
}

.log-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--hover, #f3f1ee);
  color: var(--text-2, #666);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.log-line {
  font-size: 13px;
  color: var(--text, #1a1a1a);
}

.log-meta {
  font-size: 11.5px;
  color: var(--text-3, #999);
  margin-top: 2px;
}

.sa-empty {
  color: var(--text-3, #999);
  font-size: 13px;
  padding: 20px 0;
}
</style>