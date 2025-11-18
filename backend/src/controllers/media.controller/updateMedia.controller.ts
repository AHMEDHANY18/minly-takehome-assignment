import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/requireAuth";
import { updateMediaService } from "../../services/media/updateMedia.service";

export async function updateMediaController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const mediaId = req.params.id;
    const userId = req.user!.id;

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
