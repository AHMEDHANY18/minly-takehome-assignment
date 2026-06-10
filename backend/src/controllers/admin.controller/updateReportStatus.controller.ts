import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { updateReportStatusService } from "../../services/admin/updateReportStatus.service";

export async function updateReportStatusController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const reportId = req.params.id;
    const { status } = req.body as { status: "REVIEWED" | "DISMISSED" };

    const result = await updateReportStatusService({ reportId, status });

    return res.status(200).json({
      status: "success",
      data: { id: result.id, status: result.status },
    });
  } catch (err) {
    next(err);
  }
}
