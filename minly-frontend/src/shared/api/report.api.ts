import { api } from "@/shared/api/http";

export type ReportTargetType = "MEDIA" | "COMMENT" | "USER";
export type ReportReason = "SPAM" | "ABUSE" | "INAPPROPRIATE" | "OTHER";
export type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED";

export type CreateReportBody = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
};

export type CreateReportResponse = {
  status: "success";
  data: { id: string; status: ReportStatus };
};

export type MyReport = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
};

export const ReportAPI = {
  create(body: CreateReportBody) {
    return api.post<CreateReportResponse>("/report", body);
  },

  mine() {
    return api.get<{ status: "success"; data: { reports: MyReport[] } }>(
      "/report/mine"
    );
  },
};
