import { Router } from 'express';
import { getNotifications, deleteNotification, clearAllNotifications, markNotificationAsRead, markAllAsRead } from '../controllers/notification.js';

const router = Router();

router.get('/', getNotifications);
router.delete('/:id', deleteNotification);
router.delete('/clear', clearAllNotifications);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/read', markAllAsRead);

export default router;