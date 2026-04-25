import { deleteNotifications, fetchUserNotifications } from '../services/notification.serv.js';
export const getNotifications = async (req, res, next) => {
    try {
        const id = req.user.id;
        const notifications = fetchUserNotifications(id);
        res.status(200).json({
            message: 'Notifications retrieved successfully',
            notifications: notifications
        });
    }
    catch (error) {
        next(error);
    }
};
export const clearNotification = async (req, res, next) => {
    try {
        const id = req.user.id;
        const { noteId } = req.params;
        res.status(200).json({
            message: 'Notification deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
export const clearAllNotifications = async (req, res, next) => {
    try {
        const id = req.user.id;
        await deleteNotifications(id);
        res.status(200).json({
            message: 'All notifications cleared successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
export const markNotificationAsRead = async (req, res, next) => {
    try {
        res.status(200).json({
            message: 'Notification marked as read successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
export const markAllNotificationsRead = async (req, res, next) => {
    try {
        res.status(200).json({
            message: 'All notifications marked as read successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
