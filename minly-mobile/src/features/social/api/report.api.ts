// src/features/social/api/report.api.ts
import { api } from "@/api/client";

export type ReportTargetType = "MEDIA" | "COMMENT" | "USER";
export type ReportReason = "SPAM" | "ABUSE" | "INAPPROPRIATE" | "OTHER";

export type CreateReportBody = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
};

export const ReportAPI = {
  /** POST /report — duplicate (same reporter+target) returns the existing report */
  async create(body: CreateReportBody) {
    const res = await api.post<{
      status: string;
      data: { id: string; status: string };
    }>("/report", body);
    return res.data.data;
  },

  /** GET /report/mine */
  async mine() {
    const res = await api.get<{ status: string; data: { reports: any[] } }>(
      "/report/mine"
    );
    return res.data.data?.reports ?? [];
  },
};
