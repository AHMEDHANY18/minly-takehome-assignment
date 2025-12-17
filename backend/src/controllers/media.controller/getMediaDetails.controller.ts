import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getMediaDetailsService } from "../../services/media/getMediaDetails.service";

export async function getMediaDetailsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { mediaId } = req.params;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limitRaw = Number(req.query.limit) || 20;
    const limit = Math.min(limitRaw, 50);

    const result = await getMediaDetailsService({
      mediaId,
      viewerId: req.user!.id,
      page,
      limit,
    });

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
