import { defineStore } from 'pinia';
import api from '../services/api';

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],   // liste basique (GET /projects)
    details: {},    // { [id]: { ...project, members } } (GET /projects/:id)
    loading: false,
    loaded: false,
  }),

  getters: {
    getById: (state) => (id) => state.projects.find((p) => String(p.id) === String(id)),
  },

  actions: {
    async fetchProjects(force = false) {
      if (this.loaded && !force) return this.projects;
      this.loading = true;
      try {
        const { data } = await api.get('/projects');
        this.projects = data;
        this.loaded = true;
        return data;
      } finally {
        this.loading = false;
      }
    },

    async fetchProjectDetail(id, force = false) {
      if (this.details[id] && !force) return this.details[id];
      const { data } = await api.get(`/projects/${id}`);
      this.details[id] = data;
      return data;
    },

    async updateProject(id, payload) {
  const { data } = await api.put(`/admin/projects/${id}`, payload);
  const updated = data.project; // ⚠️ à confirmer, voir note plus bas
  const idx = this.projects.findIndex((p) => p.id === id);
  if (idx !== -1) this.projects[idx] = { ...this.projects[idx], ...updated };
  if (this.details[id]) this.details[id] = { ...this.details[id], ...updated };
  return updated;
},

async deleteProject(id) {
  await api.delete(`/admin/projects/${id}`);
  this.projects = this.projects.filter((p) => p.id !== id);
  delete this.details[id];
},

   async createProject(payload) {
  const { data } = await api.post('/admin/projects', payload);
  const project = data.project;
  project.planWarning = data.planWarning;
  this.projects.unshift(project);
  return project;
},

    invalidate() {
      this.loaded = false;
      this.details = {};
    },
  },
});