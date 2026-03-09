import { Router } from 'express';
import { getNotifications, deleteNotification, clearAllNotifications, markNotificationAsRead, markAllAsRead } from '../controllers/notification.js';

const notificationRouter = Router();

notificationRouter.get('/', getNotifications);
notificationRouter.delete('/:id', deleteNotification);
notificationRouter.delete('/clear', clearAllNotifications);
notificationRouter.patch('/:id/read', markNotificationAsRead);
notificationRouter.patch('/read', markAllAsRead);

export default notificationRouter;