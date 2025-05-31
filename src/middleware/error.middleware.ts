import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values((err as any).errors).map(
      (error: any) => error.message
    );
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }

  // Handle Mongoose duplicate key errors
  if ((err as any).code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered',
      errors: ['A record with this value already exists'],
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      errors: ['Please log in again'],
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    errors: [process.env.NODE_ENV === 'development' ? err.message : undefined],
  });
};

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
}; 