// src/features/messages/hooks/useConversations.ts
import { useCallback, useRef, useState } from "react";
import { MessagesAPI, type ConversationItem } from "../api/messages.api";

export function useConversations(pageSize = 20) {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const [hasMore, setHasMore] = useState(false);

  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      pageRef.current = 1;
      const res = await MessagesAPI.listConversations({ page: 1, limit: pageSize });

      setItems(res.conversations ?? []);
      hasMoreRef.current = !!res.hasMore;
      setHasMore(!!res.hasMore);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load conversations");
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }, [pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    if (!hasMoreRef.current) return;

    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = pageRef.current + 1;
      const res = await MessagesAPI.listConversations({ page: nextPage, limit: pageSize });

      pageRef.current = nextPage;
      hasMoreRef.current = !!res.hasMore;
      setHasMore(!!res.hasMore);

      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const c of res.conversations ?? []) if (!seen.has(c.id)) merged.push(c);
        return merged;
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [pageSize, loadingMore]);

  return {
    items,
    initialLoading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    reload,
    loadMore,
  };
}
