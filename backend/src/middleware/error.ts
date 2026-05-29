import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.issues
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message
    });
  }

  // PostgreSQL unique_violation (23505) wrapped by DrizzleQueryError → 409 Conflict
  const pgCode = (err as { cause?: { code?: string } } | null)?.cause?.code
    ?? (err as { code?: string } | null)?.code;
  if (pgCode === '23505') {
    return res.status(409).json({ message: 'Resource already exists' });
  }

  res.status(500).json({
    message: 'Internal server error'
  });
}