import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/requireAuth";
import { deleteMediaService } from "../../services/media/deleteMedia.service";

export async function deleteMediaController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const mediaId = req.params.id;
    const userId = req.user?.id;

    const result = await deleteMediaService(mediaId, userId!);

    return res.status(200).json({
      status: "success",
      message: "Media deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}
