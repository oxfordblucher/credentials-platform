import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/token.js';
import { AppError } from '../errors/AppError.js';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return next(new AppError(401, "Unauthorized, no token found"));

    const decoded = verifyAccess(token);
    req.user = decoded;
    next();
  }
  catch (error) {
    next(new AppError(401, "Invalid or expired token"));
  }
}

export const authorize = (...roles: string[]) => {
  
}