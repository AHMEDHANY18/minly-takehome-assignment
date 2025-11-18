import { Request, Response, NextFunction } from "express";
import { getFeedService } from "../../services/media/getFeed.service";

export async function getFeedController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await getFeedService({ page, limit });

    return res.status(200).json({
      status: "success",
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}
