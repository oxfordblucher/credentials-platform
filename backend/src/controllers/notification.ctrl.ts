import { Request, Response, NextFunction } from 'express';
import { deleteNotifications, fetchUserNotifications } from '../services/notification.serv.js';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user!.id;
    const notifications = fetchUserNotifications(id);

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      notifications: notifications
    });
  }
  catch (error) {
    next(error);
  }
}

export const clearNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user!.id;
    const { noteId } = req.params as { noteId: string };

    res.status(200).json({
      message: 'Notification deleted successfully'
    });
  }
  catch (error) {
    next(error)
  }
}

export const clearAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user!.id;
    await deleteNotifications(id);

    res.status(200).json({
      message: 'All notifications cleared successfully'
    });
  }
  catch (error) {
    next(error)
  }
}

export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      message: 'Notification marked as read successfully'
    });
  }
  catch (error) {
    next(error)
  }
}

export const markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      message: 'All notifications marked as read successfully'
    });
  }
  catch (error) {
    next(error)
  }
}