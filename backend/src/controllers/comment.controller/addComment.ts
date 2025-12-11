import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/requireAuth";
import { createCommentService } from "../../services/comment/addComment.service";

export async function createCommentController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const mediaId = req.params.id;
    const { text } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const result = await createCommentService(mediaId, userId, text);

    return res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
