import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { createReportService } from "../../services/report/createReport.service";
import {
  ReportReasonConst,
  ReportTargetTypeConst,
} from "../../repositories/report.repository";

export async function createReportController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const reporterId = req.user?.id;
    if (!reporterId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { targetType, targetId, reason, details } = req.body as {
      targetType: ReportTargetTypeConst;
      targetId: string;
      reason: ReportReasonConst;
      details?: string;
    };

    const { report, created } = await createReportService({
      reporterId,
      targetType,
      targetId,
      reason,
      details,
    });

    // duplicate report → 200 with the existing one
    return res.status(created ? 201 : 200).json({
      status: "success",
      data: { id: report.id, status: report.status },
    });
  } catch (err) {
    next(err);
  }
}
