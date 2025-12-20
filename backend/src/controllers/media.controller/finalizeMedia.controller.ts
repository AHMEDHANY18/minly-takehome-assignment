import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { finalizePresignedUploadService } from "../../services/media/finalizePresignedMediaUpload.service";

export async function finalizeUploadController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { kind, key, title, description, type } = req.body as {
      kind?: "media" | "avatar";
      key?: string;
      title?: string;
      description?: string;
      type?: "IMAGE" | "VIDEO";
    };

    const result = await finalizePresignedUploadService({
      userId: user.id,
      kind: kind ?? "media",
      key: key ?? "",
      title,
      description,
      type,
    });

    return res.status(kind === "media" ? 201 : 200).json({
      status: "success",
      kind: result.kind,
      data: result.data,
    });
  } catch (err: any) {
    if (err.message === "MISSING_KIND") return res.status(400).json({ message: "kind is required" });
    if (err.message === "INVALID_KIND") return res.status(400).json({ message: "Invalid kind" });
    if (err.message === "MISSING_KEY") return res.status(400).json({ message: "key is required" });
    if (err.message === "FORBIDDEN_KEY") return res.status(403).json({ message: "Invalid key for this user" });
    if (err.message === "OBJECT_NOT_FOUND") return res.status(400).json({ message: "Upload not found on S3 yet" });
    if (err.message === "MISSING_MEDIA_TYPE") return res.status(400).json({ message: "type is required for media" });
    next(err);
  }
}
