import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/token.js';
import { AppError } from '../errors/AppError.js';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHead = req.headers.authorization;
    if (authHead && authHead.startsWith('Bearer ')) {
      const token = authHead.split(' ')[1];
      const decoded = verifyAccess(token);
      
      req.user = decoded;
      next();
    } else {
      return next(new AppError(401, "Unauthorized, no token found"));
    }
  }
  catch (error) {
    next(new AppError(401, "Invalid or expired token"));
  }
}

export const authorize = (...roles: string[]) => {
  
}