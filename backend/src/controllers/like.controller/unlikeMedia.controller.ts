import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/requireAuth";
import { unlikeMediaService } from "../../services/like/unlikeMedia.service";

export async function unlikeMediaController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const mediaId = req.params.id;
    const userId = req.user?.id;

    const result = await unlikeMediaService(mediaId, userId!);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
