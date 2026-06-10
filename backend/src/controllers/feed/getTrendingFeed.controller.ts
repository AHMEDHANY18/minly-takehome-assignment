import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getTrendingFeedService } from "../../services/feed/getTrendingFeed.service";

export async function getTrendingFeedController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit as string, 10) || 20;
    const limit = Math.min(Math.max(limitRaw, 1), 50);

    const windowHours = Math.min(
      Math.max(parseInt(req.query.window as string, 10) || 48, 1),
      168
    );

    const cursor = (req.query.cursor as string) || null;

    const viewerId = req.user?.id;
    if (!viewerId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const result = await getTrendingFeedService({
      page,
      limit,
      windowHours,
      viewerId,
      cursor,
    });

    return res.status(200).json({
      status: "success",
      data: result.items,
      pagination: result.pagination,
      meta: { windowHours },
    });
  } catch (err) {
    next(err);
  }
}
