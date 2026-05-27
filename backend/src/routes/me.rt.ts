import { Router } from 'express';
import { getProfile, editEmail, editName, editPassword } from '../controllers/user.ctrl.js';
import { getSessions, revokeSession, revokeOtherSessions, revokeAllSessions } from '../controllers/session.ctrl.js';
import { getNotifications, clearAllNotifications, markNotificationAsRead, markAllNotificationsRead } from '../controllers/notification.ctrl.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Profile
router.get('/', getProfile);
router.patch('/email', editEmail);
router.patch('/name', editName);
router.patch('/password', editPassword);

// Sessions
router.get('/sessions', getSessions);
router.delete('/sessions', revokeAllSessions);
router.delete('/sessions/other', revokeOtherSessions);
router.delete('/sessions/:id', revokeSession);

// Notifications
router.get('/notifications', getNotifications);
router.delete('/notifications', clearAllNotifications);
router.patch('/notifications', markAllNotificationsRead);
router.patch('/notifications/:id', markNotificationAsRead);

export default router;
