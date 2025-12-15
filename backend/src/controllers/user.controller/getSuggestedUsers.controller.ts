import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getSuggestedUsersService } from "../../services/user/getSuggestedUsers.service";

export async function getSuggestedUsersController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const viewerId = req.user?.id;
    if (!viewerId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const limitRaw = parseInt(req.query.limit as string, 10) || 5;
    const limit = Math.min(Math.max(limitRaw, 1), 20);

    const result = await getSuggestedUsersService({ viewerId, limit });

    return res.status(200).json({
      status: "success",
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}
