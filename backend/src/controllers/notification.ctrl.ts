import { Request, Response, NextFunction } from 'express';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      message: 'Notifications retrieved successfully'
    });
  }
  catch (error) {
    next(error);
  }
}

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
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