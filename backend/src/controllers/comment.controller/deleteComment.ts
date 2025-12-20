import { Response, NextFunction } from "express";
import { deleteCommentService } from "../../services/comment/deleteComment.service";
import { AuthRequest } from "../../middleware/auth/types";

export async function deleteCommentController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const commentId = req.params.commentId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const result = await deleteCommentService(commentId, userId);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
