import { Response, NextFunction } from "express";
import { createCommentService } from "../../services/comment/addComment.service";
import { replyCommentService } from "../../services/comment/replyComment.service";
import { AuthRequest } from "../../middleware/auth/types";

export async function createCommentController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const mediaId = req.params.id;
    const { text, parentCommentId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    let result;

    if (parentCommentId) {
      result = await replyCommentService(userId, text, parentCommentId);
    } else {
      result = await createCommentService(mediaId, userId, text);
    }

    return res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
