import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue'), meta: { public: true } },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
  { path: '/projects', name: 'projects', component: () => import('../views/ProjectsView.vue') },
  { path: '/projects/:id', name: 'project-detail', component: () => import('../views/ProjectDetailView.vue') },
  { path: '/projects/:id/members', name: 'project-members', component: () => import('../views/MembersView.vue') },
  { path: '/projects/:projectId/tasks/:id', name: 'task-detail', component: () => import('../views/TaskDetailView.vue') },
  { path: '/my-tasks', name: 'my-tasks', component: () => import('../views/MyTasksView.vue') },
  { path: '/notifications', name: 'notifications', component: () => import('../views/NotificationsView.vue') },
  { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue') },
  { path: '/admin/users', name: 'admin-users', component: () => import('../views/AdminUsersView.vue'), meta: { requiresAdmin: true } },

  { path: '/super-admin', name: 'super-admin-dashboard', component: () => import('../views/superadmin/SuperAdminDashboardView.vue'), meta: { requiresSuperAdmin: true } },
  { path: '/super-admin/organizations', name: 'super-admin-organizations', component: () => import('../views/superadmin/SuperAdminOrganizationsView.vue'), meta: { requiresSuperAdmin: true } },
  { path: '/super-admin/organizations/:id', name: 'super-admin-organization-detail', component: () => import('../views/superadmin/SuperAdminOrganizationDetailView.vue'), meta: { requiresSuperAdmin: true } },
  { path: '/super-admin/logs', name: 'super-admin-logs', component: () => import('../views/superadmin/SuperAdminLogsView.vue'), meta: { requiresSuperAdmin: true } },
  { path: '/super-admin/health', name: 'super-admin-health', component: () => import('../views/superadmin/SuperAdminHealthView.vue'), meta: { requiresSuperAdmin: true } },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { public: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from) => {
  try {
    console.debug('[router.beforeEach] navigating from', from.fullPath, 'to', to.fullPath);
  } catch (e) {}
  const auth = useAuthStore();
  if (to.meta.public) return;
  if (!auth.isAuthenticated) return { name: 'login' };
  if (to.meta.requiresAdmin && !auth.isAdmin) return { name: 'projects' };
  if (to.meta.requiresSuperAdmin && !auth.isSuperAdmin) return { name: 'dashboard' };
  // Empêche un super admin d'atterrir sur les vues classiques (pas de projet/organisation à lui)
  if (auth.isSuperAdmin && !to.path.startsWith('/super-admin') && to.name !== 'login') {
    return { name: 'super-admin-dashboard' };
  }
});

router.afterEach((to, from) => {
  try {
    console.debug('[router.afterEach] now at', to.fullPath);
  } catch (e) {}
});

router.onError((err) => {
  // capture router errors
  // eslint-disable-next-line no-console
  console.error('[router.onError]', err);
});

export default router;