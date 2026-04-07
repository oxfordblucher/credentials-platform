import { Router } from 'express';
import { getNotifications, deleteNotification, clearAllNotifications, markNotificationAsRead, markAllNotificationsRead } from '../controllers/notification.ctrl.js';
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get('/', getNotifications);
router.delete('/clear', clearAllNotifications);
router.delete('/:id', deleteNotification);
router.patch('/', markAllNotificationsRead);
router.patch('/:id', markNotificationAsRead);

export default router;