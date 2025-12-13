import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { toggleBookmarkService } from "../../services/bookmark/toggleBookmark.service";

export async function toggleBookmarkController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { mediaId } = req.params;
    if (!mediaId) {
      return res.status(400).json({ message: "Missing mediaId" });
    }

    const result = await toggleBookmarkService({
      userId: user.id,
      mediaId,
    });

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err: any) {
    if (err.message === "MEDIA_NOT_FOUND") {
      return res.status(404).json({ message: "Media not found" });
    }
    next(err);
  }
}
