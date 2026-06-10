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

    const { kind, contentType, type } = req.body as {
      kind?: "media" | "avatar" | "thumbnail";
      contentType?: string;
      type?: "IMAGE" | "VIDEO";
    };

    if (!kind) {
      return res.status(400).json({ message: "kind is required" });
    }

    const data = await createPresignedMediaUploadService({
      userId: user.id,
      kind,
      contentType: contentType ?? "",
      type,
    });

    return res.status(200).json({ status: "success", data });
  } catch (err: any) {
    if (err.message === "MISSING_KIND") return res.status(400).json({ message: "kind is required" });
    if (err.message === "INVALID_KIND") return res.status(400).json({ message: "Invalid kind" });
    if (err.message === "MISSING_CONTENT_TYPE") return res.status(400).json({ message: "contentType is required" });
    if (err.message === "UNSUPPORTED_CONTENT_TYPE") return res.status(400).json({ message: "Unsupported contentType" });
    if (err.message === "TYPE_MISMATCH") return res.status(400).json({ message: "type does not match contentType" });
    next(err);
  }
}
