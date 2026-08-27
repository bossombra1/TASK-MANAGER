import express from 'express';
import { authenticate, } from '../middlewares/auth.js'; // adapte le nom du fichier si besoin
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.js';
import { getTopActiveOrganizations } from '../controllers/superAdminController.js';
import { createOrganizationBySuperAdmin } from '../controllers/superAdminController.js';
import {
  getDashboard,
  getAllOrganizations,
  getOrganizationById,
  toggleOrganizationStatus,
  updateOrganizationPlan,
  deleteOrganization,
  getInactiveOrganizations,
  getAuditLogs,
} from '../controllers/superAdminController.js';

const router = express.Router();

router.use(authenticate, requireSuperAdmin);

router.get('/dashboard', getDashboard);
router.get('/organizations', getAllOrganizations);
router.get('/organizations/inactive', getInactiveOrganizations);
router.get('/organizations/top-active', getTopActiveOrganizations);
router.post('/organizations', createOrganizationBySuperAdmin);
router.get('/organizations/:id', getOrganizationById);
router.patch('/organizations/:id/status', toggleOrganizationStatus);
router.patch('/organizations/:id/plan', updateOrganizationPlan);
router.delete('/organizations/:id', deleteOrganization);
router.get('/logs', getAuditLogs);

export default router;