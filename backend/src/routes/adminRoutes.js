import express from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createUserSchema,
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  createTaskSchema,
  addTaskAssigneeSchema
} from '../validation/adminSchemas.js';
import {
  createUser,
  createProjectAndAssign,
  createTaskAndAssign,
  getAllUsers,
  addProjectMember,
  updateProject,
  deleteProject,
  deleteTask,
  addTaskAssignee
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.post('/users', validate(createUserSchema), createUser);
router.get('/users', getAllUsers);
router.post('/projects', validate(createProjectSchema), createProjectAndAssign);
router.put('/projects/:id', validate(updateProjectSchema), updateProject);
router.delete('/projects/:id', deleteProject);
router.post('/projects/:projectId/members', validate(addMemberSchema), addProjectMember);
router.post('/tasks', validate(createTaskSchema), createTaskAndAssign);
router.post('/tasks/:id/assignees', validate(addTaskAssigneeSchema), addTaskAssignee);
router.delete('/tasks/:id', deleteTask);

export default router;