// src/controllers/follow/follow.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { checkFollow } from "../../services/follow/checkFollow.service";

export async function checkFollowController(
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

    const result = await checkFollow(followerId, followingId);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
