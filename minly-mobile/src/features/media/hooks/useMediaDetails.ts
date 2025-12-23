import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MediaDetailsAPI, type MediaComment, type MediaDetailsResponse } from "@/features/media/api/mediaDetails.api";
import { UserAPI } from "@/features/profile/api/user.api";
import { SocialAPI } from "@/features/social/api/social.api";
import { InteractionsAPI } from "@/features/social/api/interactions.api";

type DetailsMedia = MediaDetailsResponse["media"];

export function useMediaDetails(mediaId: string, pageSize = 20) {
  const [media, setMedia] = useState<DetailsMedia | null>(null);
  const [comments, setComments] = useState<MediaComment[]>([]);
  const [meAvatarUrl, setMeAvatarUrl] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);

  const hasMore = useMemo(() => hasMoreRef.current, [comments.length]);

  const loadFirst = useCallback(async () => {
    setInitialLoading(true);
    setError(null);

    try {
      pageRef.current = 1;

      const [detailsRes, meRes] = await Promise.allSettled([
        MediaDetailsAPI.getDetails(mediaId, { page: 1, limit: pageSize }),
        UserAPI.getMe(),
      ]);

      if (detailsRes.status === "fulfilled") {
        const payload = detailsRes.value.data.data;
        setMedia(payload.media);
        setComments(payload.comments ?? []);
        hasMoreRef.current = Boolean(payload.pagination?.hasMore);
      } else {
        throw detailsRes.reason;
      }

      if (meRes.status === "fulfilled") {
        setMeAvatarUrl(meRes.value.data?.data?.avatarUrl ?? null);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load details");
    } finally {
      setInitialLoading(false);
    }
  }, [mediaId, pageSize]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      pageRef.current = 1;
      const res = await MediaDetailsAPI.getDetails(mediaId, { page: 1, limit: pageSize });
      const payload = res.data.data;

      setMedia(payload.media);
      setComments(payload.comments ?? []);
      hasMoreRef.current = Boolean(payload.pagination?.hasMore);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }, [mediaId, pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    if (!hasMoreRef.current) return;

    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = pageRef.current + 1;
      const res = await MediaDetailsAPI.getDetails(mediaId, { page: nextPage, limit: pageSize });
      const payload = res.data.data;

      pageRef.current = nextPage;
      hasMoreRef.current = Boolean(payload.pagination?.hasMore);

      setComments((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const it of payload.comments ?? []) if (!seen.has(it.id)) merged.push(it);
        return merged;
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [mediaId, pageSize, loadingMore]);

  const toggleLike = useCallback(async () => {
    if (!media) return;

    const prev = media;
    const nextLiked = !prev.isLiked;
    const nextLikes = nextLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1);

    setMedia({ ...prev, isLiked: nextLiked, likesCount: nextLikes });

    try {
      await InteractionsAPI.toggleLike(mediaId);
    } catch {
      setMedia(prev);
    }
  }, [media, mediaId]);

  const toggleBookmark = useCallback(async () => {
    if (!media) return;

    const prev = media;
    const next = !prev.isBookmarked;

    setMedia({ ...prev, isBookmarked: next });

    try {
      await InteractionsAPI.toggleBookmark(mediaId);
    } catch {
      setMedia(prev);
    }
  }, [media, mediaId]);

  /**
   * ✅ add comment or reply
   * - comment: parentCommentId undefined
   * - reply: parentCommentId = comment.id
   */
  const addComment = useCallback(
    async (text: string, parentCommentId?: string) => {
      const v = text.trim();
      if (!v) return { ok: false as const, created: null as any };

      setAddingComment(true);

      try {
        const res = await MediaDetailsAPI.addComment(mediaId, { text: v, parentCommentId });

        // AxiosResponse => res.data
        const body = (res as any)?.data ?? res;
        const created = body?.data;

        if (created?.id) {
          if (!parentCommentId) {
            setComments((prev) => [created, ...prev]);
          } else {
            // reply: زوّد replies count على الـ parent comment
            setComments((prev) =>
              prev.map((c) =>
                c.id === parentCommentId
                  ? { ...c, _count: { replies: (c._count?.replies ?? 0) + 1 } }
                  : c
              )
            );
          }

          return { ok: true as const, created };
        }

        await reload();
        return { ok: true as const, created: null };
      } catch {
        return { ok: false as const, created: null };
      } finally {
        setAddingComment(false);
      }
    },
    [mediaId, reload]
  );

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  return {
    media,
    comments,
    meAvatarUrl,
    initialLoading,
    refreshing,
    loadingMore,
    addingComment,
    error,
    hasMore,
    loadMore,
    reload,
    toggleLike,
    toggleBookmark,
    addComment,
  };
}
