import { Router } from 'express';
import { getNotifications, deleteNotification, clearAllNotifications, markNotificationAsRead, markAllNotificationsRead } from '../controllers/notification.ctrl.js';
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get('/', getNotifications);
router.delete('/', clearAllNotifications);
router.delete('/:noteId', deleteNotification);
router.patch('/', markAllNotificationsRead);
router.patch('/:noteId', markNotificationAsRead);

export default router;