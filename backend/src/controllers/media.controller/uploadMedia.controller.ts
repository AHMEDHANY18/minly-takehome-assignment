import { Response, NextFunction } from "express";
import { uploadMediaService } from "../../services/media/UploadMedia.service";
import { AuthRequest } from "../../middleware/auth/types";

export async function uploadMediaController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;

    if (!user) {
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

    if (!type || !["IMAGE", "VIDEO"].includes(type)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid media type",
      });
    }

    const media = await uploadMediaService({
      userId: user.id,
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
