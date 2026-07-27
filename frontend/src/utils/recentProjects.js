const MAX_RECENTS = 5;

function storageKey(userId) {
  return `taskly_recent_projects_${userId || 'anon'}`;
}

export function getRecentProjects(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushRecentProject(userId, project) {
  if (!project?.id) return;
  const current = getRecentProjects(userId).filter((p) => p.id !== project.id);
  current.unshift({ id: project.id, title: project.title });
  localStorage.setItem(storageKey(userId), JSON.stringify(current.slice(0, MAX_RECENTS)));
}

export function removeRecentProject(userId, projectId) {
  const current = getRecentProjects(userId).filter((p) => p.id !== projectId);
  localStorage.setItem(storageKey(userId), JSON.stringify(current));
}