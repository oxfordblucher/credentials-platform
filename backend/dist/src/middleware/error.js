import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
export const errorHandler = (err, req, res, next) => {
    if (err instanceof ZodError) {
        return res.status(400).json({
            message: 'Validation error',
            errors: err.errors
        });
    }
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message
        });
    }
    res.status(500).json({
        message: 'Internal server error'
    });
};
