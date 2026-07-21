import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled Exception');
  } else {
    logger.warn({ err: err.message, req: { method: req.method, url: req.url } }, 'Operational Error');
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
