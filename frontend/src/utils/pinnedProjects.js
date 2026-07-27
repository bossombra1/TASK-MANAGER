import { ref } from 'vue';

const pinnedState = ref({});

function storageKey(userId) {
  return `taskly_pinned_projects_${userId || 'anon'}`;
}

function load(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    pinnedState.value[userId] = raw ? JSON.parse(raw) : [];
  } catch {
    pinnedState.value[userId] = [];
  }
  return pinnedState.value[userId];
}

export function getPinnedProjects(userId) {
  if (!pinnedState.value[userId]) {
    load(userId);
  }
  return pinnedState.value[userId];
}

export function isPinned(userId, projectId) {
  return getPinnedProjects(userId).some((p) => p.id === projectId);
}

export function togglePin(userId, project) {
  const current = getPinnedProjects(userId);
  const idx = current.findIndex((p) => p.id === project.id);
  let nowPinned;
  if (idx === -1) {
    current.unshift({ id: project.id, title: project.title });
    nowPinned = true;
  } else {
    current.splice(idx, 1);
    nowPinned = false;
  }
  localStorage.setItem(storageKey(userId), JSON.stringify(current));
  return nowPinned;
}