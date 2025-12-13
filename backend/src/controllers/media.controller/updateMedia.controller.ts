import { Response, NextFunction } from "express";
import { updateMediaService } from "../../services/media/updateMedia.service";
import { AuthRequest } from "../../middleware/auth/types";

export async function updateMediaController(
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

    const { title, description } = req.body;

    const updatedMedia = await updateMediaService(mediaId, userId, {
      title,
      description,
    });

    return res.status(200).json({
      status: "success",
      data: updatedMedia,
    });
  } catch (err) {
    next(err);
  }
}
