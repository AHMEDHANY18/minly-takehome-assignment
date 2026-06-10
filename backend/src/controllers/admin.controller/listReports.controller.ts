import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { listReportsService } from "../../services/admin/listReports.service";
import { ReportStatusConst } from "../../repositories/admin.repository";

export async function listReportsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit as string, 10) || 10;
    const limit = Math.min(Math.max(limitRaw, 1), 50);

    const status = (req.query.status as ReportStatusConst) || undefined;

    const result = await listReportsService({ status, page, limit });

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
