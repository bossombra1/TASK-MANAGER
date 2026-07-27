import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notificationController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllNotificationsRead);

export default router;