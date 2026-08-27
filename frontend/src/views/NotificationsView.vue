<template>
  <AppLayout title="Notifications">
    <div class="page-head">
      <div>
        <h1>Notifications</h1>
        <p>{{ unreadCount }} notification{{ unreadCount > 1 ? 's' : '' }} non lue{{ unreadCount > 1 ? 's' : '' }}</p>
      </div>
      <button v-if="unreadCount > 0" class="btn btn-ghost" style="width:auto;" @click="markAllRead">
        Tout marquer comme lu
      </button>
    </div>

    <p v-if="loading" style="color:var(--text-2); font-size:13px;">Chargement...</p>
    <p v-else-if="notifications.length === 0" style="color:var(--text-2); font-size:13px;">
      Aucune notification pour le moment.
    </p>

    <div
      v-for="n in notifications"
      :key="n.id"
      class="notif-item"
      :class="{ unread: !n.is_read }"
      @click="openNotification(n)"
    >
      <div class="notif-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-9.5 8.3A8.5 8.5 0 013 12a8.38 8.38 0 018.3-9.5A8.5 8.5 0 0121 11.5z"/></svg>
      </div>
      <div class="notif-body">
        <div class="notif-text"><b>{{ n.author_nom }}</b> a commenté sur « {{ n.task_title }} »</div>
        <div class="notif-meta">{{ n.project_title }} · {{ relativeTime(n.created_at) }}</div>
      </div>
      <span v-if="!n.is_read" class="notif-unread-dot"></span>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/templates/AppLayout.vue';
import api from '../services/api';

const router = useRouter();
const notifications = ref([]);
const loading = ref(true);

const unreadCount = computed(() => notifications.value.filter((n) => !n.is_read).length);

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

const openNotification = async (n) => {
  if (!n.is_read) {
    try {
      await api.patch(`/notifications/${n.id}/read`);
      n.is_read = true;
    } catch (err) {
      console.error(err);
    }
  }
  if (n.task_id && n.project_id) {
    router.push(`/projects/${n.project_id}/tasks/${n.task_id}`);
  }
};

const markAllRead = async () => {
  try {
    await api.patch('/notifications/read-all');
    notifications.value.forEach((n) => { n.is_read = true; });
  } catch (err) {
    console.error(err);
  }
};

const fetchNotifications = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/notifications');
    notifications.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchNotifications);
</script>
