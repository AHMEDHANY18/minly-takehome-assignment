import { Response, NextFunction } from "express";
import { toggleLikeService } from "../../services/like/toggleLike.service";
import { AuthRequest } from "../../middleware/auth/types";

export async function toggleLikeController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const mediaId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const result = await toggleLikeService(mediaId, userId);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
