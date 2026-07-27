<template>
  <AppLayout :title="task?.title || 'Tâche'">
    <div v-if="loading" style="color:var(--text-2); font-size:13px;">Chargement...</div>

    <template v-else-if="task">
      <div class="page-head" style="margin-bottom:16px;">
        <div class="breadcrumb">
          <router-link :to="`/projects/${task.project_id}`">{{ task.project_title }}</router-link>
          / <b>{{ task.title }}</b>
        </div>
      </div>

      <div class="task-detail-layout">
        <div class="td-main">
          <input
            class="td-title-input"
            v-model="form.title"
            @blur="saveField('title')"
            placeholder="Titre de la tâche"
          />

          <div class="td-section">
            <div class="lbl">Description</div>
            <textarea
              class="td-desc-input"
              v-model="form.description"
              @blur="saveField('description')"
              rows="4"
              placeholder="Aucune description"
            ></textarea>
          </div>

          <div class="td-section">
            <div class="lbl">Commentaires ({{ comments.length }})</div>

            <div v-for="comment in comments" :key="comment.id" class="comment">
              <Avatar :user-id="comment.author_id" :nom="comment.author_nom" :avatar-url="comment.author_avatar" :size="30" />
              <div class="comment-body">
                <div class="comment-head">
                  <span class="name">{{ comment.author_nom }}</span>
                  <span class="time">{{ relativeTime(comment.created_at) }}</span>
                  <button
                    v-if="canDelete(comment)"
                    class="comment-delete"
                    title="Supprimer le commentaire"
                    @click="removeComment(comment)"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                  </button>
                </div>
                <div class="comment-text">{{ comment.content }}</div>
              </div>
            </div>

            <p v-if="comments.length === 0" style="color:var(--text-3); font-size:13px; margin-bottom:16px;">
              Aucun commentaire pour l'instant.
            </p>

            <div class="comment-input">
              <Avatar :user-id="auth.user?.id" :nom="auth.user?.nom" :avatar-url="auth.user?.avatar_url" :size="30" />
              <div class="comment-input-wrap">
                <textarea
                  v-model="newComment"
                  placeholder="Ajouter un commentaire..."
                  @keydown.enter.exact.prevent="postComment"
                ></textarea>
                <button class="comment-submit" :disabled="!newComment.trim() || posting" @click="postComment">
                  {{ posting ? 'Envoi...' : 'Publier' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="td-side">
          <div class="side-row">
            <span class="lbl">Statut</span>
            <div class="select-fake">
              <span class="badge" :class="statusBadge(form.status)">{{ statusLabel(form.status) }}</span>
              <select v-model="form.status" @change="saveField('status')">
                <option value="todo">À faire</option>
                <option value="doing">En cours</option>
                <option value="done">Terminé</option>
              </select>
            </div>
          </div>

          <div class="side-row">
  <span class="lbl">Priorité</span>
  <div class="select-fake" :class="{ 'is-locked': !auth.isAdmin }">
    <span class="badge" :class="priorityBadge(form.priority)">{{ priorityLabel(form.priority) }}</span>
    <select
      v-model="form.priority"
      :disabled="!auth.isAdmin"
      :title="!auth.isAdmin ? 'Réservé à l\'administrateur' : ''"
      @change="saveField('priority')"
    >
      <option value="low">Basse</option>
      <option value="medium">Moyenne</option>
      <option value="high">Haute</option>
    </select>
  </div>
</div>

          <div class="side-row">
  <span class="lbl">Échéance</span>
  <div class="date-field" :class="{ late: isOverdue, 'is-locked': !auth.isAdmin }">
    <svg class="date-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    <input
      type="date"
      v-model="form.due_date"
      :disabled="!auth.isAdmin"
      :title="!auth.isAdmin ? 'Réservé à l\'administrateur' : ''"
      @change="saveField('due_date')"
    />
    <span v-if="isOverdue" class="date-late-tag">en retard</span>
  </div>
</div>

          <div class="side-row">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <span class="lbl" style="margin-bottom:0;">Assigné(e)s</span>
              <button v-if="auth.isAdmin" class="icon-btn" style="width:24px; height:24px;" title="Ajouter un(e) assigné(e)" @click="openAssigneeModal">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>

            <div v-for="a in task.assignees || []" :key="a.id" class="assignee-pill">
              <Avatar :user-id="a.id" :nom="a.nom" :avatar-url="a.avatar_url" :size="22" />
              {{ a.nom }}
            </div>
            <span v-if="!(task.assignees || []).length" style="font-size:12.5px; color:var(--text-3);">Personne assigné</span>
            <button v-if="auth.isAdmin" class="btn btn-ghost" style="width:100%; color:var(--danger); border-color:var(--danger-soft); margin-top:8px;" @click="handleDeleteTask">
            Supprimer la tâche
          </button>
          </div>

        </div>
      </div>
      <div v-if="showAssigneeModal" class="modal-backdrop" @click.self="closeAssigneeModal">
        <div class="modal">
          <div class="modal-head">
            <h3>Ajouter un(e) assigné(e)</h3>
            <button class="modal-close" @click="closeAssigneeModal">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group" style="margin-bottom:0;">
              <label>Membre du projet</label>
              <select v-model="selectedAssigneeId">
                <option value="" disabled>Choisir un membre...</option>
                <option v-for="u in availableAssignees" :key="u.id" :value="u.id">{{ u.nom }} ({{ u.email }})</option>
              </select>
              <div v-if="availableAssignees.length === 0" class="field-hint">
                Tous les membres du projet sont déjà assignés à cette tâche.
              </div>
              <p v-if="assigneeError" style="color:var(--danger); font-size:12.5px; margin-top:8px;">{{ assigneeError }}</p>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" @click="closeAssigneeModal">Annuler</button>
            <button class="btn btn-primary" style="width:auto;" :disabled="!selectedAssigneeId || addingAssignee" @click="handleAddAssignee">
              {{ addingAssignee ? 'Ajout...' : 'Ajouter' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/AppLayout.vue';
import Avatar from '../components/Avatar.vue';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';
import { useTasksStore } from '../stores/tasks';
import { useProjectsStore } from '../stores/projects';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const tasksStore = useTasksStore();
const projectsStore = useProjectsStore();

const showAssigneeModal = ref(false);
const selectedAssigneeId = ref('');
const addingAssignee = ref(false);
const assigneeError = ref('');

const projectMembers = computed(() => projectsStore.details[task.value?.project_id]?.members || []);
const availableAssignees = computed(() =>
  projectMembers.value.filter((m) => !(task.value?.assignees || []).some((a) => a.id === m.id))
);

const openAssigneeModal = () => {
  assigneeError.value = '';
  selectedAssigneeId.value = '';
  showAssigneeModal.value = true;
};
const closeAssigneeModal = () => { showAssigneeModal.value = false; };

const handleAddAssignee = async () => {
  if (!selectedAssigneeId.value) return;
  addingAssignee.value = true;
  assigneeError.value = '';
  try {
    const assignee = await tasksStore.assignUserToTask(task.value.id, selectedAssigneeId.value);
    task.value.assignees = [...(task.value.assignees || []), assignee];
    showAssigneeModal.value = false;
  } catch (err) {
    assigneeError.value = err.response?.data?.errors?.join(', ') || err.response?.data?.message || "Erreur lors de l'ajout";
  } finally {
    addingAssignee.value = false;
  }
};

const task = ref(null);
const comments = ref([]);
const loading = ref(true);
const posting = ref(false);
const newComment = ref('');
const form = ref({ title: '', description: '', status: 'todo', priority: 'low', due_date: '' });

const statusBadge = (status) => ({ todo: 'badge-todo', doing: 'badge-progress', done: 'badge-done' }[status] || 'badge-todo');
const statusLabel = (status) => ({ todo: 'À faire', doing: 'En cours', done: 'Terminé' }[status] || status);
const priorityBadge = (priority) => ({ low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }[priority] || 'badge-low');
const priorityLabel = (priority) => ({ low: 'Basse', medium: 'Moyenne', high: 'Haute' }[priority] || priority);
const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

const isOverdue = computed(() =>
  form.value.due_date && new Date(form.value.due_date) < new Date() && form.value.status !== 'done'
);

const canDelete = (comment) => comment.author_id === auth.user?.id || auth.isAdmin;

const removeComment = async (comment) => {
  if (!confirm('Supprimer ce commentaire ?')) return;
  try {
    await api.delete(`/comments/${comment.id}`);
    comments.value = comments.value.filter((c) => c.id !== comment.id);
  } catch (err) {
    console.error(err);
  }
};

const handleDeleteTask = async () => {
  if (!confirm('Supprimer définitivement cette tâche ?')) return;
  try {
    await tasksStore.deleteTask(task.value.id, task.value.project_id);
    router.push(`/projects/${task.value.project_id}`);
  } catch (err) {
    console.error(err);
    alert('Erreur lors de la suppression de la tâche');
  }
};

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

const loadForm = (t) => {
  form.value = {
    title: t.title,
    description: t.description || '',
    status: t.status,
    priority: t.priority,
    due_date: t.due_date ? t.due_date.slice(0, 10) : '',
  };
};

const fieldMap = {
  title: (v) => ({ title: v }),
  description: (v) => ({ description: v }),
  priority: (v) => ({ priority: v }),
  due_date: (v) => ({ due_date: v || null }),
};

const saveField = async (field) => {
  if (field === 'status') {
    if (form.value.status === task.value.status) return;
    const previous = task.value.status;
    task.value.status = form.value.status; // reflet local immédiat
    try {
      await tasksStore.updateTaskStatus(task.value.id, form.value.status);
    } catch (err) {
      task.value.status = previous;
      form.value.status = previous;
      console.error(err);
    }
    return;
  }

  try {
    const updated = await tasksStore.updateTask(task.value.id, fieldMap[field](form.value[field]));
    task.value[field] = updated[field] !== undefined ? updated[field] : form.value[field];
  } catch (err) {
    console.error(err);
  }
};

const postComment = async () => {
  if (!newComment.value.trim() || posting.value) return;
  posting.value = true;
  try {
    const { data } = await api.post(`/comments/task/${task.value.id}`, { content: newComment.value.trim() });
    comments.value.push(data);
    newComment.value = '';
  } catch (err) {
    console.error(err);
  } finally {
    posting.value = false;
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const taskId = route.params.id;
    const [taskRes, commentsRes] = await Promise.all([
      api.get(`/tasks/${taskId}`),
      api.get(`/comments/task/${taskId}`),
    ]);
    task.value = taskRes.data;
    comments.value = commentsRes.data;
    loadForm(task.value);

    await Promise.all([
      tasksStore.fetchTasksByProject(task.value.project_id).catch(() => {}),
      projectsStore.fetchProjectDetail(task.value.project_id).catch(() => {}),
    ]);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}; 

onMounted(fetchData);
</script>