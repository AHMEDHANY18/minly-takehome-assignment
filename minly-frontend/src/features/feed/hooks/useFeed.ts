import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedAPI, type FeedItem, type FeedMode, type FeedPagination } from "../../../api/feed";

type State = {
  items: FeedItem[];
  pagination: FeedPagination | null;
  meta: any | null;
  initialLoading: boolean;
  loadingMore: boolean;
  error: string | null;
};

export function useFeed(mode: FeedMode, limit = 20) {
  const [state, setState] = useState<State>({
    items: [],
    pagination: null,
    meta: null,
    initialLoading: true,
    loadingMore: false,
    error: null,
  });

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      const res = await FeedAPI.list(mode, page, limit);
      if (res.data.status !== "success") throw new Error("Feed request failed");

      setState((prev) => ({
        ...prev,
        items: append ? [...prev.items, ...res.data.data] : res.data.data,
        pagination: res.data.pagination,
        meta: res.data.meta,
        error: null,
      }));
    },
    [mode, limit]
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setState((prev) => ({ ...prev, initialLoading: true, error: null }));
        const res = await FeedAPI.list(mode, 1, limit);
        if (!alive) return;

        setState((prev) => ({
          ...prev,
          items: res.data.data,
          pagination: res.data.pagination,
          meta: res.data.meta,
          initialLoading: false,
          loadingMore: false,
          error: null,
        }));
      } catch (e: any) {
        if (!alive) return;
        setState((prev) => ({
          ...prev,
          initialLoading: false,
          error: e?.message || "Failed to load feed",
        }));
      }
    })();

    return () => {
      alive = false;
    };
  }, [mode, limit]); // ✅ ده اللي بيخلي explore/trending يتغيروا فورًا

  const hasMore = useMemo(() => {
    if (!state.pagination) return false;
    return state.pagination.page < state.pagination.totalPages;
  }, [state.pagination]);

  const loadMore = useCallback(async () => {
    if (state.initialLoading || state.loadingMore) return;
    if (!state.pagination) return;
    if (state.pagination.page >= state.pagination.totalPages) return;

    const nextPage = state.pagination.page + 1;
    setState((prev) => ({ ...prev, loadingMore: true }));

    try {
      await fetchPage(nextPage, true);
    } finally {
      setState((prev) => ({ ...prev, loadingMore: false }));
    }
  }, [state.initialLoading, state.loadingMore, state.pagination, fetchPage]);

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, initialLoading: true, error: null }));
    try {
      await fetchPage(1, false);
    } finally {
      setState((prev) => ({ ...prev, initialLoading: false }));
    }
  }, [fetchPage]);

  const updateItem = useCallback((id: string, updater: (it: FeedItem) => FeedItem) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? updater(it) : it)),
    }));
  }, []);

  return {
    ...state,
    hasMore,
    loadMore,
    reload,
    updateItem,
  };
}
