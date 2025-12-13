import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { createPresignedMediaUploadService } from "../../services/media/createPresignedMediaUpload.service";

export async function presignMediaUploadController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { contentType, type } = req.body as {
      contentType?: string;
      type?: "IMAGE" | "VIDEO";
    };

    const data = await createPresignedMediaUploadService({
      userId: user.id,
      contentType: contentType ?? "",
      type,
    });

    return res.status(200).json({ status: "success", data });
  } catch (err: any) {
    if (err.message === "MISSING_CONTENT_TYPE") return res.status(400).json({ message: "contentType is required" });
    if (err.message === "UNSUPPORTED_CONTENT_TYPE") return res.status(400).json({ message: "Unsupported contentType" });
    if (err.message === "TYPE_MISMATCH") return res.status(400).json({ message: "type does not match contentType" });
    next(err);
  }
}
