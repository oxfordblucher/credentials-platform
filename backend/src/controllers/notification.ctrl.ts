import { Request, Response, NextFunction } from 'express';

export const getNotifications = (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        message: 'Notifications retrieved successfully'
    });
}

export const deleteNotification = (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        message: 'Notification deleted successfully'
    });
}

export const clearAllNotifications = (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        message: 'All notifications cleared successfully'
    });
}

export const markNotificationAsRead = (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        message: 'Notification marked as read successfully'
    });
}

export const markAllNotificationsRead = (req: Request, res: Response) => {
    res.status(200).json({
        message: 'All notifications marked as read successfully'
    });
}