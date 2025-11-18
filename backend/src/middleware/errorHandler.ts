// 1. تحديث errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the actual error for debugging
  logger.error(`[${new Date().toISOString()}] Error: ${err.message}`, {
    error: err,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Handle ValidationError from Mongoose
  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: err.message // Show actual validation error
    });
  }

  // Handle MongoError (duplicate key, etc.)
  if (err.name === "MongoError" || (err as any).code === 11000) {
    return res.status(400).json({
      status: "error",
      message: "Duplicate data detected"
    });
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message // Show the actual error message
    });
  }

  // Handle unexpected errors
  return res.status(500).json({
    status: "error",
    message: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
  });
};