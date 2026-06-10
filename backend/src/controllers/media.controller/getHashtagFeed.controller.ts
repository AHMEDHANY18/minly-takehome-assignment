import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getHashtagFeedService } from "../../services/media/getHashtagFeed.service";

export async function getHashtagFeedController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const viewerId = req.user?.id;
    if (!viewerId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const tag = (req.params.tag ?? "").trim();
    if (!tag) {
      return res.status(400).json({ status: "error", message: "tag is required" });
    }

    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit as string, 10) || 10;
    const limit = Math.min(Math.max(limitRaw, 1), 50);

    const result = await getHashtagFeedService({ viewerId, tag, page, limit });

    // same shape as the explore feed response
    return res.status(200).json({
      status: "success",
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasMore: result.hasMore,
      },
      meta: { tag },
    });
  } catch (err) {
    next(err);
  }
}
