import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getTasksByProject,
  getMyTasks,
  getTaskById,
  updateTaskStatus,
  updateTask
} from '../controllers/taskController.js';

const router = express.Router();

router.use(authenticate);

router.get('/my-tasks', getMyTasks);
router.get('/project/:projectId', getTasksByProject);
router.get('/:id', getTaskById);
router.patch('/:id/status', updateTaskStatus);
router.put('/:id', updateTask);

export default router;