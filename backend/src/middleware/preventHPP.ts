// src/middleware/preventHPP.ts
import { Request, Response, NextFunction } from "express";

export function preventHPP(req: Request, res: Response, next: NextFunction) {
  for (const key in req.query) {
    if (Array.isArray(req.query[key])) {
      // خد أول قيمة بس بدل الـ array
      req.query[key] = (req.query[key] as any)[0];
    }
  }
  next();
}
