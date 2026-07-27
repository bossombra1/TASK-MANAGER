import { useAuthStore } from './auth';
import { defineStore } from 'pinia';
import api from '../services/api';

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    myTasks: [],
    myTasksLoaded: false,
    tasksByProject: {}, // { [projectId]: Task[] }
    loading: false,
  }),

  getters: {
    myTasksCount: (state) => state.myTasks.filter((t) => t.status !== 'done').length,
  },

  actions: {
    async fetchMyTasks(force = false) {
      if (this.myTasksLoaded && !force) return this.myTasks;
      const { data } = await api.get('/tasks/my-tasks');
      this.myTasks = data;
      this.myTasksLoaded = true;
      return data;
    },

    async fetchTasksByProject(projectId, force = false) {
      if (this.tasksByProject[projectId] && !force) return this.tasksByProject[projectId];
      const { data } = await api.get(`/tasks/project/${projectId}`);
      this.tasksByProject[projectId] = data;
      return data;
    },

    async updateTaskStatus(taskId, status) {
      const previous = this._findTask(taskId)?.status;
      this._patchLocal(taskId, { status }); // optimiste
      try {
        await api.patch(`/tasks/${taskId}/status`, { status });
      } catch (err) {
        if (previous !== undefined) this._patchLocal(taskId, { status: previous });
        throw err;
      }
    },

    async deleteTask(taskId, projectId) {
  await api.delete(`/admin/tasks/${taskId}`);
  if (this.tasksByProject[projectId]) {
    this.tasksByProject[projectId] = this.tasksByProject[projectId].filter((t) => t.id !== taskId);
  }
  this.myTasks = this.myTasks.filter((t) => t.id !== taskId);
},

    async createTask(payload) {
  const { data } = await api.post('/admin/tasks', payload);
  const task = data.task;

  if (!this.tasksByProject[payload.project_id]) this.tasksByProject[payload.project_id] = [];
  this.tasksByProject[payload.project_id].push(task);

  const auth = useAuthStore();
  if (payload.assigned_user_ids?.includes(auth.user?.id)) {
    this.myTasks.push(task);
  }

  return task;
},

async assignUserToTask(taskId, userId) {
  const { data } = await api.post(`/admin/tasks/${taskId}/assignees`, { user_id: userId });
  this._addAssigneeLocal(taskId, data.assignee);
  return data.assignee;
},

_addAssigneeLocal(taskId, assignee) {
  const patch = (arr) => {
    const idx = arr.findIndex((t) => t.id === taskId);
    if (idx === -1) return;
    const current = arr[idx].assignees || [];
    if (!current.some((a) => a.id === assignee.id)) {
      arr[idx] = { ...arr[idx], assignees: [...current, assignee] };
    }
  };
  patch(this.myTasks);
  for (const projectId in this.tasksByProject) patch(this.tasksByProject[projectId]);
},

    async updateTask(taskId, payload) {
      const { data } = await api.put(`/tasks/${taskId}`, payload);
      this._patchLocal(taskId, data);
      return data;
    },

    _findTask(taskId) {
      return this.myTasks.find((t) => t.id === taskId)
        || Object.values(this.tasksByProject).flat().find((t) => t.id === taskId);
    },

    _patchLocal(taskId, patch) {
      const i = this.myTasks.findIndex((t) => t.id === taskId);
      if (i !== -1) this.myTasks[i] = { ...this.myTasks[i], ...patch };
      for (const projectId in this.tasksByProject) {
        const arr = this.tasksByProject[projectId];
        const j = arr.findIndex((t) => t.id === taskId);
        if (j !== -1) arr[j] = { ...arr[j], ...patch };
      }
    },
  },
});