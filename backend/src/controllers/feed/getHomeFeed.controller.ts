import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getHomeFeedService } from "../../services/feed/getHomeFeed.service";

export async function getHomeFeedController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit as string, 10) || 20;
    const limit = Math.min(Math.max(limitRaw, 1), 50);

    const viewerId = req.user?.id;
    if (!viewerId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const result = await getHomeFeedService({ page, limit, viewerId });

    return res.status(200).json({
      status: "success",
      data: result.items,
      pagination: result.pagination,
      meta: result.meta, // mode: home|fallback, followingCount
    });
  } catch (err) {
    next(err);
  }
}
