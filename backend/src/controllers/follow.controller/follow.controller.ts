// src/controllers/follow/follow.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/requireAuth";
import { toggleFollowService } from "../../services/follow/follow.service";

export async function toggleFollowController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const followerId = req.user?.id;
    const followingId = req.params.id;

    if (!followerId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const result = await toggleFollowService(followerId, followingId);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
