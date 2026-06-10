// src/services/report/listMyReports.service.ts
import { ReportRepository } from "../../repositories/report.repository";

export async function listMyReportsService(reporterId: string) {
  const reports = await ReportRepository.listForReporter(reporterId);
  return { reports };
}
