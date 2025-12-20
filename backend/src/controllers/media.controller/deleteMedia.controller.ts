import { Response, NextFunction } from "express";
import { deleteMediaService } from "../../services/media/deleteMedia.service";
import { AuthRequest } from "../../middleware/auth/types";

export async function deleteMediaController(
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

    await deleteMediaService(mediaId, userId);

    return res.status(200).json({
      status: "success",
      message: "Media deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}
