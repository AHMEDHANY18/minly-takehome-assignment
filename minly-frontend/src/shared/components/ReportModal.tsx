import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm grid place-items-center p-4"
      onMouseDown={() => !submitting && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-xl dark:shadow-black/40 p-6"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Report ${targetType.toLowerCase()}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
              Report {targetType.toLowerCase()}
            </div>
            <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              {targetLabel
                ? `Reporting: ${targetLabel}`
                : "Tell us what's wrong with this content."}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 w-10 -mr-2 -mt-1 rounded-full grid place-items-center text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="mt-5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            Thanks — your report was submitted.
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-300 mb-2">
                  Reason
                </label>
                <div
                  className="flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label="Report reason"
                >
                  {REASONS.map((r) => {
                    const selected = reason === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setReason(r.value)}
                        disabled={submitting}
                        className={[
                          "inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition active:scale-[0.98] disabled:opacity-50",
                          selected
                            ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                            : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                        ].join(" ")}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-300 mb-1">
                  Details (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                  placeholder="Add any extra context…"
                  className="w-full min-h-[90px] rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 px-3.5 py-2.5 text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition resize-none"
                />
              </div>

              {err && (
                <div className="rounded-xl border border-red-200/70 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
                  {err}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting && (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                )}
                {submitting ? "Reporting…" : "Submit report"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
