/**
 * Global error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger, maskSensitive } from '../lib/logger.js';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
    public isOperational = true,
    public details?: Record<string, unknown>
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error (mask sensitive data)
  const logData = maskSensitive({
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    userId: (req as any).user?.id,
  });

  if (err instanceof AppError && err.isOperational) {
    logger.warn(`⚠️  Operational error: ${err.code}`, {
      ...logData,
      error: err.message
    });

    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
    });
    return;
  }

  // Programming or unknown errors
  logger.error('💥 Unhandled error:', {
    ...logData,
    error: err.message,
    stack: err.stack
  });

  // Don't leak details in production
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    error: isProduction ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
    ...(isProduction ? {} : { stack: err.stack }),
  });
}