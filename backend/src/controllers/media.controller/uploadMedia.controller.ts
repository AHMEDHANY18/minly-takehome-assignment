import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/requireAuth";
import { uploadMediaService } from "../../services/media/UploadMedia.service";

export async function uploadMediaController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id; 

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Media file is required",
      });
    }

    const { title, description, type } = req.body;

    const media = await uploadMediaService({
      userId,
      file: req.file,
      title,
      description,
      type,
    });

    return res.status(201).json({
      status: "success",
      data: media,
    });
  } catch (err) {
    next(err);
  }
}
