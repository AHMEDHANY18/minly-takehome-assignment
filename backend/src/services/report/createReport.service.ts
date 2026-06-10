// src/services/report/createReport.service.ts
import {
  ReportRepository,
  ReportReasonConst,
  ReportTargetTypeConst,
} from "../../repositories/report.repository";

export async function createReportService(params: {
  reporterId: string;
  targetType: ReportTargetTypeConst;
  targetId: string;
  reason: ReportReasonConst;
  details?: string;
}) {
  const { reporterId, targetType, targetId, reason, details } = params;

  const exists = await ReportRepository.targetExists(targetType, targetId);
  if (!exists) {
    const err: any = new Error("Report target not found");
    err.status = 404;
    throw err;
  }

  // duplicate (same reporter + target) → return the existing report
  const existing = await ReportRepository.findExisting(
    reporterId,
    targetType,
    targetId
  );
  if (existing) {
    return { report: existing, created: false };
  }

  const report = await ReportRepository.create({
    reporterId,
    targetType,
    targetId,
    reason,
    details,
  });

  return { report, created: true };
}
