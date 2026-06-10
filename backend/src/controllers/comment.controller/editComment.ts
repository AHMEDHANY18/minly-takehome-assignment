import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { editCommentService } from "../../services/comment/editComment.service";

export async function editCommentController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const commentId = req.params.commentId;
    const { text } = req.body as { text: string };

    const result = await editCommentService(commentId, userId, text);

    return res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}
