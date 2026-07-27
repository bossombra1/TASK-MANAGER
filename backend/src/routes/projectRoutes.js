import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getMyProjects, getProjectById } from '../controllers/projectController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getMyProjects);
router.get('/:id', getProjectById);

export default router;