import { defineStore } from 'pinia';
import api from '../services/api';

export const useSuperAdminStore = defineStore('superAdmin', {
  state: () => ({
    dashboard: null,
    organizations: [],
    currentOrganization: null,
    logs: [],
    loading: false,
  }),

  actions: {
    async fetchDashboard() {
      this.loading = true;
      try {
        const { data } = await api.get('/super-admin/dashboard');
        this.dashboard = data;
        return data;
      } finally {
        this.loading = false;
      }
    },

    async fetchOrganizations(filters = {}) {
      const { data } = await api.get('/super-admin/organizations', { params: filters });
      this.organizations = data;
      return data;
    },

    async fetchOrganizationById(id) {
      const { data } = await api.get(`/super-admin/organizations/${id}`);
      this.currentOrganization = data;
      return data;
    },

    async toggleOrganizationStatus(id) {
      const { data } = await api.patch(`/super-admin/organizations/${id}/status`);
      const idx = this.organizations.findIndex((o) => o.id === id);
      if (idx !== -1) this.organizations[idx] = { ...this.organizations[idx], ...data.organization };
      return data.organization;
    },

    async updateOrganizationPlan(id, plan) {
      const { data } = await api.patch(`/super-admin/organizations/${id}/plan`, { plan });
      const idx = this.organizations.findIndex((o) => o.id === id);
      if (idx !== -1) this.organizations[idx] = { ...this.organizations[idx], ...data.organization };
      return data.organization;
    },

    async createOrganization(payload) {
  const { data } = await api.post('/super-admin/organizations', payload);
  this.organizations.unshift(data.organization);
  return data;
},

    async deleteOrganization(id) {
      await api.delete(`/super-admin/organizations/${id}`);
      this.organizations = this.organizations.filter((o) => o.id !== id);
    },

async fetchTopActiveOrganizations(days = 30) {
  const { data } = await api.get('/super-admin/organizations/top-active', { params: { days } });
  return data;
},

async fetchInactiveOrganizations(days = 30) {
  const { data } = await api.get('/super-admin/organizations/inactive', { params: { days } });
  return data;
},

    async fetchLogs() {
      const { data } = await api.get('/super-admin/logs');
      this.logs = data;
      return data;
    },
  },
});