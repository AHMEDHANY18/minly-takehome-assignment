import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // لو الـ error جاي من الخدمات بتاعتنا
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Errors غير متوقعة (runtime)
  logger.error(err);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
