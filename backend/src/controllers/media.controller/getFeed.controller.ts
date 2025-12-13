import { Request, Response, NextFunction } from "express";
import { getFeedService } from "../../services/media/getFeed.service";
import { AuthRequest } from "../../middleware/auth/types";

export async function getFeedController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const user = req.user?.id
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const result = await getFeedService({ page, limit, user });

    return res.status(200).json({
      status: "success",
      data: result?.items,
      pagination: result?.pagination,
    });
  } catch (err) {
    next(err);
  }
}
