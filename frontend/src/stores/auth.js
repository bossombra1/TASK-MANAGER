import { defineStore } from 'pinia';
import api from '../services/api';
import { useProjectsStore } from './projects';
import { useTasksStore } from './tasks';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    organizationName: localStorage.getItem('organizationName') || null,
    organizationSlug: localStorage.getItem('organizationSlug') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isSuperAdmin: (state) => state.user?.role === 'super_admin',
  },

  actions: {
    setUser(userData) {
      this.user = userData;
      this.organizationName = userData.organizationName || null;
      this.organizationSlug = userData.organizationSlug || null;
      localStorage.setItem('user', JSON.stringify(this.user));
      if (this.organizationName) {
        localStorage.setItem('organizationName', this.organizationName);
      } else {
        localStorage.removeItem('organizationName');
      }
      if (this.organizationSlug) {
        localStorage.setItem('organizationSlug', this.organizationSlug);
      } else {
        localStorage.removeItem('organizationSlug');
      }
    },

    // Vide le cache des autres stores — appelé au login ET au logout,
    // pour ne jamais laisser les données d'un compte précédent visibles.
    resetOtherStores() {
      const projectsStore = useProjectsStore();
      const tasksStore = useTasksStore();
      projectsStore.$reset();
      tasksStore.$reset();
    },

    async login(email, password) {
      const response = await api.post('/auth/login', { email, password });
      this.resetOtherStores();
      this.token = response.data.token;
      this.setUser(response.data.user);
      localStorage.setItem('token', this.token);
    },

    async register(organizationName, nom, email, password) {
      const response = await api.post('/auth/register', { organizationName, nom, email, password });
      this.resetOtherStores();
      this.token = response.data.token;
      this.setUser(response.data.user);
      localStorage.setItem('token', this.token);
    },

    updateUser(user) {
      this.user = { ...this.user, ...user };
      localStorage.setItem('user', JSON.stringify(this.user));
    },

    async fetchMe() {
      try {
        const response = await api.get('/auth/me');
        this.setUser(response.data.user);
      } catch (error) {
        this.logout();
      }
    },

    logout() {
      this.resetOtherStores();
      this.token = null;
      this.user = null;
      this.organizationName = null;
      this.organizationSlug = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('organizationName');
      localStorage.removeItem('organizationSlug');
    },
  },
});