import { Request, Response } from "express";

export function getMe(req: Request, res: Response) {
  // requireAuth هو اللي حط req.user
  return res.json({
    user: req.user,
  });
}
