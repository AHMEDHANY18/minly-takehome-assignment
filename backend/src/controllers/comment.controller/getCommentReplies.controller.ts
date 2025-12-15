import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getCommentRepliesService } from "../../services/comment/getCommentReplies.service";

export async function getCommentRepliesController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const viewerId = req.user?.id;
    if (!viewerId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { commentId } = req.params;
    const limitRaw = parseInt(req.query.limit as string, 10) || 5;
    const limit = Math.min(Math.max(limitRaw, 1), 20);

    // cursor = createdAt ISO string (اختيار بسيط)
    const cursor = (req.query.cursor as string) || null;

    const result = await getCommentRepliesService({
      commentId,
      viewerId,
      limit,
      cursor,
    });

    return res.status(200).json({
      status: "success",
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}
