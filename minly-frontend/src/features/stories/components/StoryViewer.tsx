import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { StoriesAPI, type StoryGroup } from "../api/stories.api";

const IMAGE_DURATION_MS = 5000;

export default function StoryViewer({
  groups,
  initialGroupIndex,
  meId,
  onClose,
  onViewed,
  onChanged,
}: {
  groups: StoryGroup[];
  initialGroupIndex: number;
  meId?: string;
  onClose: () => void;
  /** Story was shown and marked viewed (update the bar's local state). */
  onViewed: (storyId: string) => void;
  /** Stories changed (e.g. one deleted) — refresh the bar. */
  onChanged: () => void;
}) {
  // Local copy so deletions can be handled without remounting from the parent.
  const [localGroups, setLocalGroups] = useState<StoryGroup[]>(groups);
  const [gIdx, setGIdx] = useState(() =>
    Math.min(Math.max(initialGroupIndex, 0), Math.max(groups.length - 1, 0))
  );
  const [sIdx, setSIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const group = localGroups[gIdx];
  const story = group?.stories[sIdx];
  const isOwn = !!meId && group?.user.id === meId;

  /* ---------------- Navigation ---------------- */

  const goNext = useCallback(() => {
    setProgress(0);
    setConfirmDelete(false);
    const g = localGroups[gIdx];
    if (g && sIdx < g.stories.length - 1) {
      setSIdx((i) => i + 1);
      return;
    }
    if (gIdx < localGroups.length - 1) {
      setGIdx((i) => i + 1);
      setSIdx(0);
      return;
    }
    onClose();
  }, [localGroups, gIdx, sIdx, onClose]);

  const goPrev = useCallback(() => {
    setProgress(0);
    setConfirmDelete(false);
    if (sIdx > 0) {
      setSIdx((i) => i - 1);
      return;
    }
    if (gIdx > 0) {
      const prevGroup = localGroups[gIdx - 1];
      setGIdx((i) => i - 1);
      setSIdx(Math.max(prevGroup.stories.length - 1, 0));
    }
  }, [localGroups, gIdx, sIdx]);

  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  /* ---------------- Keyboard ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  /* ---------------- Image auto-advance timer ---------------- */

  useEffect(() => {
    if (!story || story.type !== "IMAGE") return;
    setProgress(0);
    const started = Date.now();
    const timer = setInterval(() => {
      const p = (Date.now() - started) / IMAGE_DURATION_MS;
      if (p >= 1) {
        clearInterval(timer);
        goNextRef.current();
      } else {
        setProgress(p);
      }
    }, 50);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, story?.type]);

  // Reset progress when a video story is entered (progress comes from the element).
  useEffect(() => {
    if (story?.type === "VIDEO") setProgress(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, story?.type]);

  /* ---------------- Mark viewed / viewer count ---------------- */

  useEffect(() => {
    if (!story || !group) return;

    setViewerCount(null);

    if (isOwn) {
      let cancelled = false;
      StoriesAPI.viewers(story.id)
        .then((res) => {
          if (!cancelled) setViewerCount(res.data.data.count ?? 0);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    if (!story.viewed) {
      StoriesAPI.markViewed(story.id).catch(() => {});
      onViewed(story.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  /* ---------------- Delete (own) ---------------- */

  const deleteCurrent = async () => {
    if (!story || deleting) return;
    setDeleting(true);
    try {
      await StoriesAPI.remove(story.id);
      onChanged();

      const next = localGroups
        .map((g, i) =>
          i === gIdx
            ? { ...g, stories: g.stories.filter((s) => s.id !== story.id) }
            : g
        )
        .filter((g) => g.stories.length > 0);

      if (next.length === 0) {
        onClose();
        return;
      }

      const newGIdx = Math.min(gIdx, next.length - 1);
      const newSIdx = Math.max(
        0,
        Math.min(sIdx, next[newGIdx].stories.length - 1)
      );

      setLocalGroups(next);
      setGIdx(newGIdx);
      setSIdx(newSIdx);
      setProgress(0);
      setConfirmDelete(false);
    } catch {
      // keep the viewer open; nothing to do
    } finally {
      setDeleting(false);
    }
  };

  /* ---------------- Render ---------------- */

  const timeLabel = useMemo(
    () => (story ? formatTimeAgo(story.createdAt) : ""),
    [story]
  );

  if (!group || !story) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${group.user.name}'s story`}
    >
      <div className="relative w-full h-full md:w-[420px] md:h-[88vh] md:rounded-2xl overflow-hidden bg-gray-950">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-3 pt-3">
          {group.stories.map((s, i) => (
            <div
              key={s.id}
              className="h-[3px] flex-1 rounded-full bg-white/30 overflow-hidden"
            >
              <div
                className="h-full bg-white"
                style={{
                  width:
                    i < sIdx ? "100%" : i === sIdx ? `${progress * 100}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-5 left-0 right-0 z-30 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {group.user.avatarUrl ? (
              <img
                src={group.user.avatarUrl}
                alt={group.user.name}
                className="h-8 w-8 rounded-full object-cover border border-white/30"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/20 grid place-items-center text-white text-sm font-semibold">
                {(group.user.name?.[0] ?? "U").toUpperCase()}
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-semibold text-white truncate">
                {isOwn ? "Your story" : group.user.name}
              </div>
              <div className="text-[11px] text-white/70">{timeLabel}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isOwn && (
              <>
                {confirmDelete ? (
                  <button
                    onClick={deleteCurrent}
                    disabled={deleting}
                    className="h-9 px-3 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition disabled:opacity-60"
                  >
                    {deleting ? "Deleting…" : "Confirm delete"}
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="h-9 w-9 rounded-full hover:bg-white/10 transition grid place-items-center text-white"
                    aria-label="Delete story"
                  >
                    <IconTrash />
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full hover:bg-white/10 transition grid place-items-center text-white text-lg"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Media */}
        <div className="absolute inset-0 grid place-items-center">
          {story.type === "VIDEO" ? (
            <video
              key={story.id}
              src={story.url}
              autoPlay
              playsInline
              className="max-h-full max-w-full object-contain"
              ref={(el) => {
                if (!el) return;
                // If unmuted autoplay is blocked, retry muted so the story
                // never stalls.
                el.play().catch(() => {
                  el.muted = true;
                  el.play().catch(() => {});
                });
              }}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration > 0) setProgress(v.currentTime / v.duration);
              }}
              onEnded={() => goNextRef.current()}
              onError={() => goNextRef.current()}
            />
          ) : (
            <img
              key={story.id}
              src={story.url}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        {/* Click zones (prev / next) */}
        <button
          onClick={goPrev}
          className="absolute inset-y-0 left-0 w-1/2 z-20 cursor-pointer"
          aria-label="Previous story"
        />
        <button
          onClick={goNext}
          className="absolute inset-y-0 right-0 w-1/2 z-20 cursor-pointer"
          aria-label="Next story"
        />

        {/* Own story: viewer count */}
        {isOwn && (
          <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/55 border border-white/10 backdrop-blur px-3 py-1.5 text-white text-xs font-semibold">
              <IconEyeSmall />
              {viewerCount === null
                ? "…"
                : `${viewerCount} viewer${viewerCount === 1 ? "" : "s"}`}
            </div>
          </div>
        )}
      </div>
    </motion.div>,
    document.body
  );
}

/* ---------------- Icons / helpers ---------------- */

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEyeSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function formatTimeAgo(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}
