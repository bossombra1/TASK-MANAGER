export const PLAN_LIMITS = {
  free: { projects: 3, members: 10, tasksPerProject: 5 },
  pro: { projects: 10, members: 20, tasksPerProject: 15 }, // null = illimité
  enterprise: { projects: null, members: null, tasksPerProject: null },
};

export const PLAN_LABELS = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };
export const NEXT_PLAN = { free: 'pro', pro: 'enterprise', enterprise: null };