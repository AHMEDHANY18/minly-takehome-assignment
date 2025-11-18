import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/requireAuth";
import { toggleLikeService } from "../../services/like/toggleLike.service";

export async function toggleLikeController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const mediaId = req.params.id;
    const userId = req.user?.id;

    const result = await toggleLikeService(mediaId, userId!);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
