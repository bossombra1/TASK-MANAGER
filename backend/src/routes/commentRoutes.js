import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getCommentsByTask, addComment, deleteComment } from '../controllers/commentController.js';

const router = express.Router();
router.use(authenticate);

router.get('/task/:taskId', getCommentsByTask);
router.post('/task/:taskId', addComment);
router.delete('/:id', deleteComment);

export default router;