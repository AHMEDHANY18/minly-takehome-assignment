import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getCommentRepliesService } from "../../services/comment/getCommentReplies.service";

type GetCommentRepliesDTO = {
  commentId: string;
  viewerId: string;
  limit: number;
  cursor: string | null;
};

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

    const dto: GetCommentRepliesDTO = {
      commentId: req.params.commentId,
      viewerId,
      limit: Math.min(Math.max(parseInt(req.query.limit as string, 10) || 5, 1), 20),
      cursor: (req.query.cursor as string) || null,
    };

    const result = await getCommentRepliesService(dto);

    return res.status(200).json({
      status: "success",
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}
