import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { finalizePresignedMediaUploadService } from "../../services/media/finalizePresignedMediaUpload.service";

export async function finalizeMediaUploadController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { key, title, description, type } = req.body as {
      key?: string;
      title?: string;
      description?: string;
      type?: "IMAGE" | "VIDEO";
    };

    if (!type || !["IMAGE", "VIDEO"].includes(type)) {
      return res.status(400).json({ message: "Invalid media type" });
    }

    const media = await finalizePresignedMediaUploadService({
      userId: user.id,
      key: key ?? "",
      title,
      description,
      type,
    });

    return res.status(201).json({ status: "success", data: media });
  } catch (err: any) {
    if (err.message === "MISSING_KEY") return res.status(400).json({ message: "key is required" });
    if (err.message === "FORBIDDEN_KEY") return res.status(403).json({ message: "Invalid key for this user" });
    if (err.message === "OBJECT_NOT_FOUND") return res.status(400).json({ message: "Upload not found on S3 yet" });
    next(err);
  }
}
