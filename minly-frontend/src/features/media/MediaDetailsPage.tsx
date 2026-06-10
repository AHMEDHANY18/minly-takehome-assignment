import { useEffect, useMemo, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  MediaDetailsAPI,
  type MediaComment,
  type ReplyItem,
  type MediaDetailsResponse,
} from "@/features/media/api/media-details.api";
import { SocialAPI } from "@/shared/api/social.api";
import { useUserStore } from "@/shared/store/user.store";
import { IconBookmark, IconComment, IconHeart, IconSend } from "../feed/icons";
import ReportModal from "@/shared/components/ReportModal";
import HashtagText from "@/shared/components/HashtagText";

/* ---------------- Types ---------------- */

type MediaState = MediaDetailsResponse["media"];

/* ---------------- Page ---------------- */

export default function MediaDetailsPage() {
  const nav = useNavigate();
  const { mediaId } = useParams();
  const me = useUserStore((s) => s.user);

  const [media, setMedia] = useState<MediaState | null>(null);

  const [comments, setComments] = useState<MediaComment[]>([]);
  const [pagination, setPagination] =
    useState<MediaDetailsResponse["pagination"] | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // replies
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [replies, setReplies] = useState<Record<string, ReplyItem[]>>({});
  const [repliesLoading, setRepliesLoading] = useState<Record<string, boolean>>(
    {}
  );

  // composer
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null
  );
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  // report modal target (media or comment)
  const [report, setReport] = useState<{
    targetType: "MEDIA" | "COMMENT";
    targetId: string;
    label?: string;
  } | null>(null);

  // inline comment edit
  const [editingComment, setEditingComment] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const uploader = media?.uploader;

  /* ---------------- FOLLOW (uploader) ---------------- */

  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followBusy, setFollowBusy] = useState(false);

  // ✅ checkFollow
  useEffect(() => {
    const uploaderId = uploader?.id;

    // reset state
    setIsFollowing(null);
    setFollowBusy(false);

    if (!uploaderId) return;
    if (!me) return;

    let cancelled = false;

    SocialAPI.checkFollow(uploaderId)
      .then((v) => {
        if (!cancelled) setIsFollowing(v);
      })
      .catch(() => {
        if (!cancelled) setIsFollowing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uploader?.id, me]);

  const toggleUploaderFollow = async () => {
    const uploaderId = uploader?.id;
    if (!uploaderId) return;
    if (!me) return;

    if (isFollowing === null) return;
    if (followBusy) return;

    const before = isFollowing;

    // optimistic
    setIsFollowing(!before);
    setFollowBusy(true);

    try {
      const serverNext = await SocialAPI.toggleFollow(uploaderId);
      if (typeof serverNext === "boolean") {
        setIsFollowing(serverNext);
      }
    } catch {
      // rollback
      setIsFollowing(before);
    } finally {
      setFollowBusy(false);
    }
  };

  /* ---------------- Load details (media + comments) ---------------- */

  const [page, setPage] = useState(1);

  const fetchDetails = async (targetPage: number, mode: "replace" | "append") => {
    if (!mediaId) return;

    setErr(null);
    if (mode === "replace") setLoading(true);

    try {
      const res = await MediaDetailsAPI.getDetails(mediaId, {
        page: targetPage,
        limit: 20,
      });
      const d = res.data.data;

      setMedia(d.media);
      setPagination(d.pagination);

      if (mode === "replace") {
        setComments(d.comments ?? []);
        setPage(targetPage);
      } else {
        setComments((prev) => [...prev, ...(d.comments ?? [])]);
        setPage(targetPage);
      }
    } catch (error) {
      setErr(
        (error as AxiosError<{ message?: string }>).response?.data?.message ??
          (error instanceof Error
            ? error.message
            : "Failed to load media details.")
      );
    } finally {
      if (mode === "replace") setLoading(false);
    }
  };

  useEffect(() => {
    if (!mediaId) return;
    fetchDetails(1, "replace");
  }, [mediaId]);

  const loadMoreComments = () => {
    if (!pagination?.hasMore) return;
    fetchDetails(page + 1, "append");
  };

  /* ---------------- Derived ---------------- */

  const likeCountLabel = useMemo(() => {
    if (!media) return "";
    return `${Number(media.likesCount ?? 0).toLocaleString()} likes`;
  }, [media]);

  /* ---------------- Actions ---------------- */

  const onToggleLike = async () => {
    if (!media) return;
    const snapshot = { isLiked: media.isLiked, likesCount: media.likesCount };

    setMedia((m) => {
      if (!m) return m;
      const nextLiked = !m.isLiked;
      const nextLikes = Math.max(0, m.likesCount + (nextLiked ? 1 : -1));
      return { ...m, isLiked: nextLiked, likesCount: nextLikes };
    });

    try {
      await SocialAPI.toggleLike(media.id);
    } catch {
      setMedia((m) => (m ? { ...m, ...snapshot } : m));
    }
  };

  const onToggleBookmark = async () => {
    if (!media) return;
    const snapshot = { isBookmarked: media.isBookmarked };

    setMedia((m) => (m ? { ...m, isBookmarked: !m.isBookmarked } : m));

    try {
      await SocialAPI.toggleBookmark(media.id);
    } catch {
      setMedia((m) => (m ? { ...m, ...snapshot } : m));
    }
  };

  const loadReplies = async (commentId: string) => {
    if (repliesLoading[commentId]) return;

    setRepliesLoading((p) => ({ ...p, [commentId]: true }));
    try {
      const res = await MediaDetailsAPI.getReplies(commentId, { limit: 5 });
      setReplies((prev) => ({ ...prev, [commentId]: res.data.data ?? [] }));
      setExpanded((prev) => ({ ...prev, [commentId]: true }));
    } finally {
      setRepliesLoading((p) => {
        const c = { ...p };
        delete c[commentId];
        return c;
      });
    }
  };

  const toggleReplies = (c: MediaComment) => {
    const has = !!expanded[c.id];
    if (has) {
      setExpanded((p) => ({ ...p, [c.id]: false }));
      return;
    }
    if (replies[c.id]) {
      setExpanded((p) => ({ ...p, [c.id]: true }));
      return;
    }
    loadReplies(c.id);
  };

  const submitComment = async () => {
    if (!mediaId || !me) return;

    const text = commentText.trim();
    if (!text) return;

    setPosting(true);

    const optimisticComment: MediaComment = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
      user: {
        id: me.id,
        name: me.name,
        avatarUrl: me.avatarUrl ?? null,
      },
      _count: { replies: 0 },
    };

    try {
      await MediaDetailsAPI.addComment(mediaId, {
        text,
        parentCommentId: replyTo?.id,
      });

      if (!replyTo) {
        setComments((prev) => [...prev, optimisticComment]);
      } else {
        const optimisticReply: ReplyItem = {
          id: optimisticComment.id,
          text: optimisticComment.text,
          createdAt: optimisticComment.createdAt,
          user: optimisticComment.user,
        };

        setReplies((prev) => ({
          ...prev,
          [replyTo.id]: [...(prev[replyTo.id] ?? []), optimisticReply],
        }));

        setExpanded((p) => ({ ...p, [replyTo.id]: true }));

        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, _count: { replies: (c._count?.replies ?? 0) + 1 } }
              : c
          )
        );
      }

      setCommentText("");
      setReplyTo(null);
    } catch (e) {
      console.error("Failed to add comment", e);
    } finally {
      setPosting(false);
    }
  };

  const saveCommentEdit = async () => {
    if (!editingComment || editSaving) return;

    const text = editingComment.text.trim();
    if (!text) return;

    setEditSaving(true);
    try {
      const res = await MediaDetailsAPI.editComment(editingComment.id, text);
      const updated = res.data.data;

      setComments((prev) =>
        prev.map((c) =>
          c.id === editingComment.id
            ? {
                ...c,
                text: updated?.text ?? text,
                isEdited: updated?.isEdited ?? true,
                updatedAt: updated?.updatedAt ?? new Date().toISOString(),
              }
            : c
        )
      );
      setEditingComment(null);
    } catch (e) {
      console.error("Failed to edit comment", e);
    } finally {
      setEditSaving(false);
    }
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="mx-auto max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 grid place-items-center text-white font-bold">
            M
          </div>
          <div className="font-semibold text-gray-900">Minly</div>
        </div>

        <button
          onClick={() => nav(-1)}
          className="h-10 w-10 rounded-full hover:bg-gray-100 transition grid place-items-center text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px]">
        {/* Media */}
        <div className="bg-gray-50">
          {loading && !media ? (
            <div className="h-[78vh] grid place-items-center text-sm text-gray-500">
              Loading media…
            </div>
          ) : !media ? (
            <div className="h-[78vh] grid place-items-center text-sm text-gray-500">
              {err ? "Failed to load media." : "No media found."}
            </div>
          ) : media.type === "VIDEO" ? (
            <video
              className="w-full h-full max-h-[78vh] object-cover"
              controls
              preload="metadata"
              poster={media.thumbnailUrl ?? undefined}
            >
              <source src={media.url} />
            </video>
          ) : (
            <img
              src={media.url}
              className="w-full h-full max-h-[78vh] object-cover"
            />
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col h-[78vh]">
          {/* Uploader */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Avatar
                name={uploader?.name ?? "User"}
                src={uploader?.avatarUrl ?? null}
              />
              <div className="text-sm font-semibold">
                {uploader?.name ?? "User"}
              </div>

              {uploader?.id && me?.id !== uploader.id && (
                <button
                  onClick={toggleUploaderFollow}
                  disabled={followBusy || isFollowing === null}
                  className={[
                    "h-8 px-4 rounded-full text-sm font-semibold transition disabled:opacity-60",
                    isFollowing
                      ? "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50"
                      : "bg-blue-600 text-white hover:bg-blue-700",
                  ].join(" ")}
                >
                  {isFollowing === null || followBusy
                    ? "..."
                    : isFollowing
                    ? "Following"
                    : "Follow"}
                </button>
              )}
            </div>

            <button className="h-9 w-9 rounded-full hover:bg-gray-50">⋯</button>
          </div>

          {/* Caption */}
          {!!media?.title || !!media?.description ? (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex gap-3">
                <Avatar
                  name={uploader?.name ?? "User"}
                  src={uploader?.avatarUrl ?? null}
                  size="sm"
                />
                <div className="text-sm">
                  <span className="font-semibold">
                    {uploader?.name ?? "User"}
                  </span>{" "}
                  <HashtagText
                    text={(media?.description || media?.title) ?? ""}
                    className="text-gray-700"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Comments */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : err ? (
              <div className="text-sm text-red-600">{err}</div>
            ) : (
              <>
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <Avatar
                        name={c.user.name}
                        src={c.user.avatarUrl ?? null}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        {editingComment?.id === c.id ? (
                          <div>
                            <textarea
                              value={editingComment.text}
                              onChange={(e) =>
                                setEditingComment({
                                  id: c.id,
                                  text: e.target.value.slice(0, 500),
                                })
                              }
                              rows={2}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                              autoFocus
                            />
                            <div className="mt-1 flex gap-3 text-xs">
                              <button
                                onClick={saveCommentEdit}
                                disabled={editSaving || !editingComment.text.trim()}
                                className="font-semibold text-blue-700 hover:underline disabled:opacity-50"
                              >
                                {editSaving ? "Saving…" : "Save"}
                              </button>
                              <button
                                onClick={() => setEditingComment(null)}
                                disabled={editSaving}
                                className="text-gray-500 hover:underline disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <span className="font-semibold">{c.user.name}</span>{" "}
                            <span className="text-gray-700">{c.text}</span>
                            {c.isEdited ? (
                              <span className="ml-1 text-[11px] text-gray-400">
                                (edited)
                              </span>
                            ) : null}
                          </div>
                        )}

                        <div className="mt-1 flex gap-3 text-xs text-gray-400">
                          <span>{formatTime(c.createdAt)}</span>
                          <button
                            onClick={() => {
                              setReplyTo({ id: c.id, name: c.user.name });
                              commentInputRef.current?.focus();
                            }}
                            className="hover:underline"
                          >
                            Reply
                          </button>
                          {me?.id === c.user.id ? (
                            <button
                              onClick={() =>
                                setEditingComment({ id: c.id, text: c.text })
                              }
                              className="hover:underline"
                            >
                              Edit
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setReport({
                                  targetType: "COMMENT",
                                  targetId: c.id,
                                  label: `${c.user.name}'s comment`,
                                })
                              }
                              className="hover:underline inline-flex items-center gap-1"
                              aria-label="Report comment"
                            >
                              <IconFlag size={11} />
                              Report
                            </button>
                          )}
                          {c._count?.replies ? (
                            <button
                              onClick={() => toggleReplies(c)}
                              className="hover:underline"
                            >
                              {expanded[c.id]
                                ? "Hide replies"
                                : `View replies (${c._count.replies})`}
                            </button>
                          ) : null}
                        </div>

                        {expanded[c.id] && (replies[c.id]?.length ?? 0) > 0 ? (
                          <div className="mt-3 pl-3 border-l border-gray-100 space-y-3">
                            {replies[c.id].map((r) => (
                              <div key={r.id} className="flex gap-3">
                                <Avatar
                                  name={r.user.name}
                                  src={r.user.avatarUrl ?? null}
                                  size="xs"
                                />
                                <div className="text-sm">
                                  <span className="font-semibold">
                                    {r.user.name}
                                  </span>{" "}
                                  <span className="text-gray-700">{r.text}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination?.hasMore ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={loadMoreComments}
                      className="h-10 px-5 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition text-sm font-semibold"
                    >
                      Load more
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100">
            <div className="px-4 py-3 flex items-center">
              <button
                onClick={onToggleLike}
                className="h-10 w-10 rounded-full hover:bg-gray-50 grid place-items-center"
              >
                <IconHeart filled={!!media?.isLiked} />
              </button>

              <button
                onClick={() => commentInputRef.current?.focus()}
                className="h-10 w-10 rounded-full hover:bg-gray-50 grid place-items-center"
              >
                <IconComment />
              </button>

              <button className="h-10 w-10 rounded-full hover:bg-gray-50 grid place-items-center">
                <IconSend />
              </button>

              {media && me?.id !== uploader?.id && (
                <button
                  onClick={() =>
                    setReport({
                      targetType: "MEDIA",
                      targetId: media.id,
                      label: media.title?.trim() || "this post",
                    })
                  }
                  className="h-10 w-10 rounded-full hover:bg-gray-50 grid place-items-center text-gray-700"
                  aria-label="Report media"
                >
                  <IconFlag />
                </button>
              )}

              <button
                onClick={onToggleBookmark}
                className="ml-auto h-10 w-10 rounded-full hover:bg-gray-50 grid place-items-center"
              >
                <IconBookmark filled={!!media?.isBookmarked} />
              </button>
            </div>

            <div className="px-4 pb-2">
              <div className="text-sm font-semibold">{likeCountLabel}</div>
              <div className="text-[11px] text-gray-400">
                {formatDate(media?.createdAt)}
              </div>
            </div>

            {replyTo && (
              <div className="px-4 pt-2 text-xs text-gray-500 flex justify-between">
                <span>
                  Replying to <b>{replyTo.name}</b>
                </span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-blue-700 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="px-4 py-3 flex items-center gap-3">
              <Avatar
                name={me?.name ?? "You"}
                src={me?.avatarUrl ?? null}
                size="sm"
              />
              <input
                ref={commentInputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                className="flex-1 h-11 rounded-full bg-gray-50 border border-gray-200 px-4 text-sm"
                placeholder={
                  replyTo ? `Reply to ${replyTo.name}…` : "Add a comment…"
                }
              />
              <button
                disabled={posting || !commentText.trim()}
                onClick={submitComment}
                className="text-sm font-semibold text-blue-700 disabled:opacity-40"
              >
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        open={!!report}
        targetType={report?.targetType ?? "MEDIA"}
        targetId={report?.targetId ?? ""}
        targetLabel={report?.label}
        onClose={() => setReport(null)}
      />
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function IconFlag({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 21V4m0 1h13l-2.5 4L17 13H4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src: string | null;
  size?: "md" | "sm" | "xs";
}) {
  const dim = size === "md" ? 40 : size === "sm" ? 32 : 24;
  const initial = (name?.[0] ?? "U").toUpperCase();

  return src ? (
    <img
      src={src}
      style={{ width: dim, height: dim }}
      className="rounded-full object-cover"
    />
  ) : (
    <div
      style={{ width: dim, height: dim }}
      className="rounded-full bg-gray-100 border grid place-items-center text-gray-700 font-semibold"
    >
      <span style={{ fontSize: size === "xs" ? 11 : 13 }}>{initial}</span>
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-US", { month: "long", day: "numeric" })
    .toUpperCase();
}
