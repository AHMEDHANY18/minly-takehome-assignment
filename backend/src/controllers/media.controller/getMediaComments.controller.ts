import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getMediaCommentsService } from "../../services/media/getMediaComments.service";

export async function getMediaCommentsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { mediaId } = req.params;
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit as string, 10) || 20;
    const limit = Math.min(limitRaw, 50);

    const result = await getMediaCommentsService({
      mediaId,
      page,
      limit,
      viewerId: req.user!.id,
    });

    return res.status(200).json({
      status: "success",
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}
