import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { adminDeleteCommentService } from "../../services/admin/adminDeleteComment.service";

export async function deleteCommentAdminController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const commentId = req.params.id;
    const adminId = req.user!.id;

    const result = await adminDeleteCommentService(commentId, adminId);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
