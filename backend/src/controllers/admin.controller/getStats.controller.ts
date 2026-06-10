import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getAdminStatsService } from "../../services/admin/getAdminStats.service";

export async function getStatsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const stats = await getAdminStatsService();

    return res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}
