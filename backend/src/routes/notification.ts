import { Router } from 'express';
import { getNotifications, deleteNotification, clearAllNotifications, markNotificationAsRead, markAllNotificationsRead } from '../controllers/notification.js';
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get('/', getNotifications);
router.delete('/:id', deleteNotification);
router.delete('/clear', clearAllNotifications);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/read', markAllNotificationsRead);

export default router;