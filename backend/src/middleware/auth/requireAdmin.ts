// src/middleware/auth/requireAdmin.ts
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./types";

/**
 * Must run AFTER requireAuth (relies on req.user).
 */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ status: "error", message: "Admin only" });
  }
  return next();
}
