import { useCallback, useRef, useState } from "react";
import { MediaDetailsAPI, type ReplyItem } from "@/features/media/api/mediaDetails.api";

export function useCommentReplies(commentId: string, limit = 10) {
  const [items, setItems] = useState<ReplyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef<boolean>(true);

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setError(null);
    cursorRef.current = null;
    hasMoreRef.current = true;

    try {
      const res = await MediaDetailsAPI.getReplies(commentId, { limit, cursor: null });
      if (res.data.status !== "success") throw new Error("Failed to load replies");

      setItems(res.data.data ?? []);
      cursorRef.current = res.data.meta?.nextCursor ?? null;
      hasMoreRef.current = Boolean(res.data.meta?.hasMore);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load replies");
    } finally {
      setLoading(false);
    }
  }, [commentId, limit]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    if (!hasMoreRef.current) return;

    setLoadingMore(true);
    setError(null);

    try {
      const res = await MediaDetailsAPI.getReplies(commentId, {
        limit,
        cursor: cursorRef.current,
      });

      if (res.data.status !== "success") throw new Error("Failed to load more replies");

      const next = res.data.data ?? [];

      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const r of next) if (!seen.has(r.id)) merged.push(r);
        return merged;
      });

      cursorRef.current = res.data.meta?.nextCursor ?? null;
      hasMoreRef.current = Boolean(res.data.meta?.hasMore);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load more replies");
    } finally {
      setLoadingMore(false);
    }
  }, [commentId, limit, loadingMore]);

  const addLocalReply = useCallback((reply: ReplyItem) => {
    setItems((prev) => [reply, ...prev]);
  }, []);

  return {
    items,
    loading,
    loadingMore,
    error,
    loadFirst,
    loadMore,
    addLocalReply,
  };
}
