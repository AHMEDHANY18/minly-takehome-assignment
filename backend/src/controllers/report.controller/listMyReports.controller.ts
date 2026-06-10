import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { listMyReportsService } from "../../services/report/listMyReports.service";

export async function listMyReportsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const result = await listMyReportsService(userId);

    return res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}
