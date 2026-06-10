import {
  AdminRepository,
  ReportStatusConst,
} from "../../repositories/admin.repository";

async function getTargetPreview(targetType: string, targetId: string) {
  try {
    if (targetType === "MEDIA") {
      return await AdminRepository.getMediaPreview(targetId);
    }
    if (targetType === "COMMENT") {
      return await AdminRepository.getCommentPreview(targetId);
    }
    return await AdminRepository.getUserPreview(targetId);
  } catch {
    return null;
  }
}

export async function listReportsService(params: {
  status?: ReportStatusConst;
  page: number;
  limit: number;
}) {
  const { status, page, limit } = params;
  const skip = (page - 1) * limit;

  const [rows, total] = await AdminRepository.listReportsWithCount({
    status,
    skip,
    take: limit,
  });

  // target preview per report (null when the target was deleted)
  const reports = await Promise.all(
    rows.map(async (report) => ({
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.createdAt,
      reporter: report.reporter,
      target: await getTargetPreview(report.targetType, report.targetId),
    }))
  );

  return {
    reports,
    page,
    limit,
    total,
    hasMore: skip + reports.length < total,
  };
}
