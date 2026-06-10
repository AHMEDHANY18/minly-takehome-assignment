import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getMetricsSnapshot } from "../../observability/metrics";

export async function getMetricsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    return res.status(200).json({
      status: "success",
      data: getMetricsSnapshot(),
    });
  } catch (err) {
    next(err);
  }
}
