import db from '../config/db.js';
import { PLAN_LIMITS, PLAN_LABELS, NEXT_PLAN } from '../config/planLimits.js';

// Récupère le plan actuel d'une organisation
const getOrganizationPlan = async (organizationId) => {
  const { rows } = await db.query('SELECT plan FROM organizations WHERE id = $1', [organizationId]);
  return rows[0]?.plan || 'free';
};

// Vérifie si une création est autorisée pour une ressource donnée (projects | members | tasksPerProject)
// currentCountFn : fonction async qui retourne le nombre actuel de cette ressource
// Retourne { allowed, blocked, warning, limit, plan } — le controller décide quoi faire avec.
export const checkPlanLimit = async (organizationId, resourceType, currentCountFn) => {
  const plan = await getOrganizationPlan(organizationId);
  const limit = PLAN_LIMITS[plan]?.[resourceType];

  if (limit === null || limit === undefined) {
    return { blocked: false, warning: null, plan, limit: null };
  }

  const currentCount = await currentCountFn();

  if (currentCount >= limit) {
    const nextPlan = NEXT_PLAN[plan];
    return {
      blocked: true,
      message: nextPlan
        ? `Limite du forfait ${PLAN_LABELS[plan]} atteinte (${limit}). Passez au forfait ${PLAN_LABELS[nextPlan]} pour continuer.`
        : `Limite du forfait ${PLAN_LABELS[plan]} atteinte (${limit}).`,
      plan,
      limit,
    };
  }

  // Avertissement : il ne reste plus qu'une place après cette création (avant-dernier élément)
  if (currentCount === limit - 2) {
    return {
      blocked: false,
      warning: `Attention, il ne vous restera plus qu'une place sur votre forfait ${PLAN_LABELS[plan]} après cette création.`,
      plan,
      limit,
    };
  }

  return { blocked: false, warning: null, plan, limit };
};