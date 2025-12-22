import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FeedAPI, type FeedItem, type FeedMode, type FeedMeta, type FeedPagination } from "../api/feed.api";

export function useFeed(mode: FeedMode, pageSize = 20) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [meta, setMeta] = useState<FeedMeta | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const paginationRef = useRef<FeedPagination | null>(null);

  const hasMore = useMemo(() => {
    const p = paginationRef.current;
    if (!p) return false;
    return p.page < p.totalPages;
  }, [items.length]);

  const loadFirst = useCallback(async () => {
    setInitialLoading(true);
    setError(null);

    try {
      pageRef.current = 1;

      const res = await FeedAPI.list({ mode, page: 1, limit: pageSize });

      setItems(res.items);
      setMeta(res.meta ?? null);
      paginationRef.current = res.pagination;
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load feed");
    } finally {
      setInitialLoading(false);
    }
  }, [mode, pageSize]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      pageRef.current = 1;

      const res = await FeedAPI.list({ mode, page: 1, limit: pageSize });

      setItems(res.items);
      setMeta(res.meta ?? null);
      paginationRef.current = res.pagination;
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to refresh feed");
    } finally {
      setRefreshing(false);
    }
  }, [mode, pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;

    const p = paginationRef.current;
    if (!p) return;
    if (p.page >= p.totalPages) return;

    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = pageRef.current + 1;

      const res = await FeedAPI.list({ mode, page: nextPage, limit: pageSize });

      pageRef.current = nextPage;
      paginationRef.current = res.pagination;

      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const it of res.items) if (!seen.has(it.id)) merged.push(it);
        return merged;
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [mode, pageSize, loadingMore]);

  const updateItem = useCallback((id: string, patch: Partial<FeedItem>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  return {
    items,
    meta,
    initialLoading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reload,
    updateItem,
  };
}
