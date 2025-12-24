import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { BookmarksAPI, type SavedMedia, type SavedSort, type SavedType } from "@/features/saved/api/bookmarks.api";

export type SavedTab = "ALL" | "IMAGE" | "VIDEO";

export function useSaved(limit = 24) {
  const [items, setItems] = useState<SavedMedia[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const [tab, setTab] = useState<SavedTab>("ALL");
  const [sort, setSort] = useState<SavedSort>("recent");

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const type: SavedType | undefined = useMemo(() => {
    if (tab === "IMAGE") return "image";
    if (tab === "VIDEO") return "video";
    return undefined;
  }, [tab]);

  const fetchPage = useCallback(
    async (p: number, mode: "replace" | "append") => {
      try {
        setError(null);
        const res = await BookmarksAPI.list({ page: p, limit, sort, type });

        const data = res.data.data ?? [];
        const pag = res.data.pagination;

        setHasMore(!!pag?.hasNext);
        setTotal(pag?.total ?? 0);

        setItems((prev) => (mode === "append" ? [...prev, ...data] : data));
        setPage(p);
      } catch (error) {
        setError(getErrorMessage(error, "Failed to load saved items."));
      }
    },
    [limit, sort, type]
  );

  // initial + when sort/type changes
  useEffect(() => {
    setInitialLoading(true);
    fetchPage(1, "replace").finally(() => setInitialLoading(false));
  }, [fetchPage]);

  const reload = useCallback(async () => {
    setInitialLoading(true);
    await fetchPage(1, "replace").finally(() => setInitialLoading(false));
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await fetchPage(page + 1, "append").finally(() => setLoadingMore(false));
  }, [fetchPage, hasMore, loadingMore, page]);

  return {
    items,
    page,
    hasMore,
    total,
    tab,
    sort,
    initialLoading,
    loadingMore,
    error,
    setTab,
    setSort,
    reload,
    loadMore,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return (
    axiosError.response?.data?.message ??
    (error instanceof Error ? error.message : fallback)
  );
}
