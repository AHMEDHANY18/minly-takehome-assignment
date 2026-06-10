import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import {
  ReportAPI,
  type ReportReason,
  type ReportTargetType,
} from "@/shared/api/report.api";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "SPAM", label: "Spam" },
  { value: "ABUSE", label: "Abuse or harassment" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "OTHER", label: "Other" },
];

export default function ReportModal({
  open,
  targetType,
  targetId,
  targetLabel,
  onClose,
}: {
  open: boolean;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel?: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason("SPAM");
    setDetails("");
    setSubmitting(false);
    setDone(false);
    setErr(null);
  }, [open, targetId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onClose, 1600);
    return () => clearTimeout(t);
  }, [done, onClose]);

  if (!open) return null;

  const submit = async () => {
    if (submitting || done) return;
    setSubmitting(true);
    setErr(null);

    try {
      await ReportAPI.create({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      setDone(true);
    } catch (error) {
      const ax = error as AxiosError<{ message?: string }>;
      setErr(ax.response?.data?.message ?? "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm grid place-items-center p-4"
      onMouseDown={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-[0_18px_60px_rgba(16,24,40,0.25)] p-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">
              Report {targetType.toLowerCase()}
            </div>
            <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">
              {targetLabel
                ? `Reporting: ${targetLabel}`
                : "Tell us what's wrong with this content."}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 w-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition grid place-items-center text-gray-700 dark:text-gray-200 disabled:opacity-60"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="mt-5 rounded-xl border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            Thanks — your report was submitted.
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900"
                >
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Details (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                  placeholder="Add any extra context…"
                  className="w-full min-h-[90px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 resize-none"
                />
              </div>

              {err && (
                <div className="rounded-xl border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
                  {err}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60"
              >
                {submitting ? "Reporting…" : "Submit report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
