import {
  AdminRepository,
  ReportStatusConst,
} from "../../repositories/admin.repository";

export async function updateReportStatusService(params: {
  reportId: string;
  status: Exclude<ReportStatusConst, "PENDING">;
}) {
  const { reportId, status } = params;

  const report = await AdminRepository.findReportById(reportId);
  if (!report) {
    const err: any = new Error("Report not found");
    err.status = 404;
    throw err;
  }

  return AdminRepository.updateReportStatus(reportId, status);
}
