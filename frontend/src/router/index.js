import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
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
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { public: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.meta.public) return next();
  if (!auth.isAuthenticated) return next({ name: 'login' });
  if (to.meta.requiresAdmin && !auth.isAdmin) return next({ name: 'projects' });
  next();
});

export default router;