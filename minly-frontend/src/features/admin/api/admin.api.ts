import { api } from "@/shared/api/http";
import type {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "@/shared/api/report.api";

/* ---------------- Stats ---------------- */

export type AdminStats = {
  users: number;
  media: number;
  comments: number;
  likes: number;
  reports: { total: number; pending: number };
  conversations: number;
  activeStories: number;
};

export type AdminMetrics = {
  uptimeSeconds: number;
  memory: { rss: number; heapUsed: number };
  requests: {
    total: number;
    errors5xx: number;
    byRoute: Array<{ route: string; count: number; avgMs: number }>;
  };
};

/* ---------------- Reports ---------------- */

export type AdminMediaPreview = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO";
  title: string | null;
  uploader: { id: string; name: string };
};

export type AdminCommentPreview = {
  id: string;
  text: string;
  user: { id: string; name: string };
};

export type AdminUserPreview = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type AdminReportTarget =
  | AdminMediaPreview
  | AdminCommentPreview
  | AdminUserPreview;

export type AdminReport = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; name: string; avatarUrl: string | null };
  target: AdminReportTarget | null;
};

export type AdminReportsPage = {
  reports: AdminReport[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

/* ---------------- API ---------------- */

export const AdminAPI = {
  stats() {
    return api.get<{ status: "success"; data: AdminStats }>("/admin/stats");
  },

  metrics() {
    return api.get<{ status: "success"; data: AdminMetrics }>("/admin/metrics");
  },

  reports(params: { status?: ReportStatus; page?: number; limit?: number }) {
    return api.get<{ status: "success"; data: AdminReportsPage }>(
      "/admin/reports",
      { params }
    );
  },

  updateReport(reportId: string, status: "REVIEWED" | "DISMISSED") {
    return api.patch<{
      status: "success";
      data: { id: string; status: ReportStatus };
    }>(`/admin/reports/${reportId}`, { status });
  },

  deleteMedia(mediaId: string) {
    return api.delete<{ status: "success" }>(`/admin/media/${mediaId}`);
  },

  deleteComment(commentId: string) {
    return api.delete<{ status: "success" }>(`/admin/comment/${commentId}`);
  },
};
