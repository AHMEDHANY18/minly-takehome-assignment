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
import { IconBookmark, IconComment, IconEye, IconHeart, IconSend } from "../feed/icons";
import ReportModal from "@/shared/components/ReportModal";
import HashtagText from "@/shared/components/HashtagText";
import { formatCompact } from "@/shared/utils/format";

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
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white font-bold">
            M
          </div>
          <div className="font-semibold text-gray-900 dark:text-zinc-100">Minly</div>
        </div>

        <button
          onClick={() => nav(-1)}
          className="h-10 w-10 rounded-full grid place-items-center text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px]">
        {/* Media */}
        <div className="bg-gray-100 dark:bg-zinc-950">
          {loading && !media ? (
            <div className="h-[78vh] animate-pulse bg-gray-200/70 dark:bg-zinc-800" />
          ) : !media ? (
            <div className="h-[78vh] grid place-items-center">
              <div className="flex flex-col items-center text-center px-6">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 grid place-items-center text-gray-400 dark:text-zinc-500">
                  <IconEye />
                </div>
                <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                  {err ? "Failed to load media." : "No media found."}
                </div>
              </div>
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
        <div className="flex flex-col h-[78vh] md:border-l md:border-gray-200/70 md:dark:border-zinc-800">
          {/* Uploader */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200/70 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <Avatar
                name={uploader?.name ?? "User"}
                src={uploader?.avatarUrl ?? null}
              />
              <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                {uploader?.name ?? "User"}
              </div>

              {uploader?.id && me?.id !== uploader.id && (
                <button
                  onClick={toggleUploaderFollow}
                  disabled={followBusy || isFollowing === null}
                  className={[
                    "h-8 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
                    isFollowing
                      ? "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800"
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

            <button
              className="h-9 w-9 rounded-full grid place-items-center text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
              aria-label="More"
            >
              ⋯
            </button>
          </div>

          {/* Caption */}
          {!!media?.title || !!media?.description ? (
            <div className="px-4 py-3 border-b border-gray-200/70 dark:border-zinc-800">
              <div className="flex gap-3">
                <Avatar
                  name={uploader?.name ?? "User"}
                  src={uploader?.avatarUrl ?? null}
                  size="sm"
                />
                <div className="text-sm">
                  <span className="font-semibold text-gray-900 dark:text-zinc-100">
                    {uploader?.name ?? "User"}
                  </span>{" "}
                  <HashtagText
                    text={(media?.description || media?.title) ?? ""}
                    className="text-gray-600 dark:text-zinc-400"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Comments */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <CommentsSkeleton />
            ) : err ? (
              <div className="text-sm text-red-600 dark:text-red-400">{err}</div>
            ) : comments.length === 0 ? (
              <div className="h-full grid place-items-center">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 grid place-items-center text-gray-400 dark:text-zinc-500">
                    <IconComment />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    No comments yet
                  </div>
                  <div className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                    Be the first to share your thoughts.
                  </div>
                </div>
              </div>
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
                              className="w-full rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 p-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition resize-none"
                              autoFocus
                            />
                            <div className="mt-1 flex gap-3 text-xs">
                              <button
                                onClick={saveCommentEdit}
                                disabled={editSaving || !editingComment.text.trim()}
                                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                              >
                                {editSaving ? "Saving…" : "Save"}
                              </button>
                              <button
                                onClick={() => setEditingComment(null)}
                                disabled={editSaving}
                                className="text-gray-500 dark:text-zinc-400 hover:underline disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900 dark:text-zinc-100">
                              {c.user.name}
                            </span>{" "}
                            <span className="text-gray-600 dark:text-zinc-400">
                              {c.text}
                            </span>
                            {c.isEdited ? (
                              <span className="ml-1 text-[11px] text-gray-400 dark:text-zinc-500">
                                (edited)
                              </span>
                            ) : null}
                          </div>
                        )}

                        <div className="mt-1 flex gap-3 text-xs text-gray-400 dark:text-zinc-500">
                          <span>{formatTime(c.createdAt)}</span>
                          <button
                            onClick={() => {
                              setReplyTo({ id: c.id, name: c.user.name });
                              commentInputRef.current?.focus();
                            }}
                            className="font-medium hover:text-gray-600 dark:hover:text-zinc-300 hover:underline transition"
                          >
                            Reply
                          </button>
                          {me?.id === c.user.id ? (
                            <button
                              onClick={() =>
                                setEditingComment({ id: c.id, text: c.text })
                              }
                              className="font-medium hover:text-gray-600 dark:hover:text-zinc-300 hover:underline transition"
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
                              className="font-medium hover:text-gray-600 dark:hover:text-zinc-300 hover:underline transition inline-flex items-center gap-1"
                              aria-label="Report comment"
                            >
                              <IconFlag size={11} />
                              Report
                            </button>
                          )}
                          {c._count?.replies ? (
                            <button
                              onClick={() => toggleReplies(c)}
                              className="font-medium hover:text-gray-600 dark:hover:text-zinc-300 hover:underline transition"
                            >
                              {expanded[c.id]
                                ? "Hide replies"
                                : `View replies (${c._count.replies})`}
                            </button>
                          ) : null}
                        </div>

                        {expanded[c.id] && (replies[c.id]?.length ?? 0) > 0 ? (
                          <div className="mt-3 pl-3 border-l-2 border-gray-100 dark:border-zinc-800 space-y-3">
                            {replies[c.id].map((r) => (
                              <div key={r.id} className="flex gap-3">
                                <Avatar
                                  name={r.user.name}
                                  src={r.user.avatarUrl ?? null}
                                  size="xs"
                                />
                                <div className="text-sm">
                                  <span className="font-semibold text-gray-900 dark:text-zinc-100">
                                    {r.user.name}
                                  </span>{" "}
                                  <span className="text-gray-600 dark:text-zinc-400">
                                    {r.text}
                                  </span>
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
                      className="inline-flex items-center justify-center h-10 px-5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition"
                    >
                      Load more
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200/70 dark:border-zinc-800">
            <div className="px-4 py-3 flex items-center">
              <button
                onClick={onToggleLike}
                className={[
                  "h-10 w-10 rounded-full grid place-items-center transition active:scale-[0.98]",
                  media?.isLiked
                    ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <IconHeart filled={!!media?.isLiked} />
              </button>

              <button
                onClick={() => commentInputRef.current?.focus()}
                className="h-10 w-10 rounded-full grid place-items-center text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition active:scale-[0.98]"
              >
                <IconComment />
              </button>

              <button className="h-10 w-10 rounded-full grid place-items-center text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition active:scale-[0.98]">
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
                  className="h-10 w-10 rounded-full grid place-items-center text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition active:scale-[0.98]"
                  aria-label="Report media"
                >
                  <IconFlag />
                </button>
              )}

              <button
                onClick={onToggleBookmark}
                className={[
                  "ml-auto h-10 w-10 rounded-full grid place-items-center transition active:scale-[0.98]",
                  media?.isBookmarked
                    ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <IconBookmark filled={!!media?.isBookmarked} />
              </button>
            </div>

            <div className="px-4 pb-2">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                  {likeCountLabel}
                </div>
                {media?.viewsCount != null && (
                  <div
                    className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400"
                    aria-label="Views"
                  >
                    <IconEye size={14} />
                    {formatCompact(media.viewsCount)} views
                  </div>
                )}
              </div>
              <div className="text-[11px] text-gray-400 dark:text-zinc-500">
                {formatDate(media?.createdAt)}
              </div>
            </div>

            {replyTo && (
              <div className="px-4 pt-2 text-xs text-gray-500 dark:text-zinc-400 flex justify-between">
                <span>
                  Replying to <b>{replyTo.name}</b>
                </span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
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
                className="flex-1 h-11 rounded-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition"
                placeholder={
                  replyTo ? `Reply to ${replyTo.name}…` : "Add a comment…"
                }
              />
              <button
                disabled={posting || !commentText.trim()}
                onClick={submitComment}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition disabled:opacity-40 disabled:pointer-events-none"
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

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-full bg-gray-200/70 dark:bg-zinc-800" />
          <div className="flex-1">
            <div className="h-3 w-40 rounded-xl bg-gray-200/70 dark:bg-zinc-800" />
            <div className="mt-2 h-3 w-24 rounded-xl bg-gray-200/70 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

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
      className="rounded-full object-cover bg-gray-100 dark:bg-zinc-800"
      loading="lazy"
    />
  ) : (
    <div
      style={{ width: dim, height: dim }}
      className="rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 grid place-items-center text-gray-600 dark:text-zinc-300 font-semibold"
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
