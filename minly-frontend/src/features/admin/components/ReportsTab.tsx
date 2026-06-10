import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReportStatus } from "@/shared/api/report.api";
import {
  AdminAPI,
  type AdminCommentPreview,
  type AdminMediaPreview,
  type AdminReport,
  type AdminUserPreview,
} from "../api/admin.api";
import { useAdminReports, type ReportFilter } from "../hooks/useAdminReports";

const FILTERS: { value: ReportFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "DISMISSED", label: "Dismissed" },
];

type ConfirmState = {
  report: AdminReport;
  kind: "media" | "comment";
} | null;

export default function ReportsTab() {
  const [filter, setFilter] = useState<ReportFilter>("PENDING");

  const {
    reports,
    total,
    hasMore,
    initialLoading,
    loadingMore,
    error,
    reload,
    loadMore,
    updateReportLocal,
  } = useAdminReports(filter);

  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const setStatus = async (report: AdminReport, status: "REVIEWED" | "DISMISSED") => {
    if (busy[report.id]) return;
    setBusy((b) => ({ ...b, [report.id]: true }));
    setActionError(null);
    try {
      await AdminAPI.updateReport(report.id, status);
      updateReportLocal(report.id, (r) => ({ ...r, status }));
    } catch {
      setActionError("Failed to update the report. Please try again.");
    } finally {
      setBusy((b) => {
        const copy = { ...b };
        delete copy[report.id];
        return copy;
      });
    }
  };

  const deleteContent = async () => {
    if (!confirm || confirmBusy) return;
    const { report, kind } = confirm;

    setConfirmBusy(true);
    setActionError(null);
    try {
      if (kind === "media") await AdminAPI.deleteMedia(report.targetId);
      else await AdminAPI.deleteComment(report.targetId);

      // Backend marks related PENDING reports REVIEWED; mirror that locally.
      updateReportLocal(report.id, (r) => ({
        ...r,
        status: r.status === "PENDING" ? "REVIEWED" : r.status,
        target: null,
      }));
      setConfirm(null);
    } catch {
      setActionError("Failed to delete the content. Please try again.");
      setConfirm(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={[
              "h-9 px-4 rounded-full text-sm font-semibold transition",
              filter === f.value
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}

        <div className="ml-auto text-xs text-gray-400">
          {total} report{total === 1 ? "" : "s"}
        </div>
      </div>

      {actionError && (
        <div className="mt-4 rounded-xl border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {actionError}
        </div>
      )}

      {/* List */}
      <div className="mt-4 space-y-3">
        {error ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900 p-4 shadow-sm">
            <div className="text-sm text-red-600 dark:text-red-400 font-semibold">
              Failed to load reports
            </div>
            <div className="text-xs text-gray-500 mt-1">{error}</div>
            <button
              onClick={reload}
              className="mt-3 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : initialLoading ? (
          <ReportsSkeleton />
        ) : reports.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-10 text-center">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              No reports here
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Nothing matches this filter right now.
            </div>
          </div>
        ) : (
          <>
            {reports.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                busy={!!busy[r.id]}
                onReview={() => setStatus(r, "REVIEWED")}
                onDismiss={() => setStatus(r, "DISMISSED")}
                onDeleteContent={(kind) => setConfirm({ report: r, kind })}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="h-10 px-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm grid place-items-center p-4"
          onMouseDown={() => !confirmBusy && setConfirm(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-[0_18px_60px_rgba(16,24,40,0.25)] p-5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">
              Delete {confirm.kind === "media" ? "media" : "comment"}?
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This permanently removes the reported{" "}
              {confirm.kind === "media" ? "media" : "comment"} for all users.
              This action cannot be undone.
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirm(null)}
                disabled={confirmBusy}
                className="h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={deleteContent}
                disabled={confirmBusy}
                className="h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60"
              >
                {confirmBusy ? "Deleting…" : "Delete content"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Report card ---------------- */

function ReportCard({
  report,
  busy,
  onReview,
  onDismiss,
  onDeleteContent,
}: {
  report: AdminReport;
  busy: boolean;
  onReview: () => void;
  onDismiss: () => void;
  onDeleteContent: (kind: "media" | "comment") => void;
}) {
  const canDelete =
    !!report.target &&
    (report.targetType === "MEDIA" || report.targetType === "COMMENT");

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <SmallAvatar name={report.reporter.name} src={report.reporter.avatarUrl} />
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {report.reporter.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              reported a {report.targetType.toLowerCase()} ·{" "}
              {formatDateTime(report.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ReasonBadge reason={report.reason} />
          <StatusBadge status={report.status} />
        </div>
      </div>

      {report.details && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          “{report.details}”
        </p>
      )}

      {/* Target preview */}
      <div className="mt-3">
        <TargetPreview report={report} />
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {report.status !== "REVIEWED" && (
          <button
            onClick={onReview}
            disabled={busy}
            className="h-9 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            Mark reviewed
          </button>
        )}
        {report.status !== "DISMISSED" && (
          <button
            onClick={onDismiss}
            disabled={busy}
            className="h-9 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-60"
          >
            Dismiss
          </button>
        )}
        {canDelete && (
          <button
            onClick={() =>
              onDeleteContent(report.targetType === "MEDIA" ? "media" : "comment")
            }
            disabled={busy}
            className="h-9 px-4 rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-gray-800 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition disabled:opacity-60"
          >
            Delete content
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Target preview ---------------- */

function TargetPreview({ report }: { report: AdminReport }) {
  const nav = useNavigate();

  if (!report.target) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
        The reported {report.targetType.toLowerCase()} has been deleted.
      </div>
    );
  }

  if (report.targetType === "MEDIA") {
    const t = report.target as AdminMediaPreview;
    return (
      <button
        onClick={() => nav(`/media/${t.id}`)}
        className="w-full flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {t.thumbnailUrl || t.type === "IMAGE" ? (
            <img
              src={t.thumbnailUrl ?? t.url}
              alt={t.title ?? "media"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <video
              src={t.url}
              preload="metadata"
              muted
              playsInline
              className="h-full w-full object-cover pointer-events-none"
            />
          )}
          {t.type === "VIDEO" && (
            <div className="absolute inset-0 grid place-items-center text-white text-xs bg-black/25">
              ▶
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {(t.title ?? "").trim() || "Untitled"}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            by {t.uploader?.name ?? "Unknown"}
          </div>
        </div>
      </button>
    );
  }

  if (report.targetType === "COMMENT") {
    const t = report.target as AdminCommentPreview;
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
        <div className="text-sm text-gray-700 dark:text-gray-200">“{t.text}”</div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          comment by {t.user?.name ?? "Unknown"}
        </div>
      </div>
    );
  }

  const t = report.target as AdminUserPreview;
  return (
    <button
      onClick={() => nav(`/profile/${t.id}`)}
      className="w-full flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition"
    >
      <SmallAvatar name={t.name} src={t.avatarUrl} />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {t.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.email}</div>
      </div>
    </button>
  );
}

/* ---------------- Bits ---------------- */

function StatusBadge({ status }: { status: ReportStatus }) {
  const styles: Record<ReportStatus, string> = {
    PENDING:
      "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    REVIEWED:
      "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    DISMISSED:
      "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[11px] font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ReasonBadge({ reason }: { reason: string }) {
  return (
    <span className="inline-flex items-center h-6 px-2.5 rounded-full border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
      {reason}
    </span>
  );
}

function SmallAvatar({ name, src }: { name: string; src?: string | null }) {
  const initial = (name?.[0] ?? "U").toUpperCase();
  return src ? (
    <img src={src} alt={name} className="h-9 w-9 rounded-full object-cover" />
  ) : (
    <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 grid place-items-center text-gray-700 dark:text-gray-200 font-semibold text-sm">
      {initial}
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800" />
            <div className="flex-1">
              <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="mt-2 h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          </div>
          <div className="mt-4 h-14 rounded-xl bg-gray-50 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
