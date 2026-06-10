// src/features/search/hooks/useSearch.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchPage } from "../api/search.api";

type Fetcher<T> = (params: {
  q: string;
  page?: number;
  limit?: number;
}) => Promise<SearchPage<T>>;

/**
 * Generic paginated search state for one result kind (users or media).
 * Re-runs when `q` changes; ignores stale responses.
 */
export function useSearch<T extends { id: string }>(
  q: string,
  fetcher: Fetcher<T>,
  pageSize = 20
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;

    if (!q) {
      setItems([]);
      setError(null);
      setHasMore(false);
      setTotal(0);
      setLoading(false);
      hasMoreRef.current = false;
      return;
    }

    setLoading(true);
    setError(null);

    fetcher({ q, page: 1, limit: pageSize })
      .then((res) => {
        if (seq !== requestSeq.current) return; // stale
        pageRef.current = 1;
        hasMoreRef.current = res.hasMore;
        setItems(res.items);
        setHasMore(res.hasMore);
        setTotal(res.total);
      })
      .catch((e: any) => {
        if (seq !== requestSeq.current) return;
        setError(e?.response?.data?.message ?? e?.message ?? "Search failed");
      })
      .finally(() => {
        if (seq === requestSeq.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pageSize]);

  const loadMore = useCallback(async () => {
    if (!q || loadingMore || !hasMoreRef.current) return;

    setLoadingMore(true);
    const seq = requestSeq.current;

    try {
      const nextPage = pageRef.current + 1;
      const res = await fetcher({ q, page: nextPage, limit: pageSize });

      if (seq !== requestSeq.current) return; // query changed mid-flight

      pageRef.current = nextPage;
      hasMoreRef.current = res.hasMore;
      setHasMore(res.hasMore);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pageSize, loadingMore]);

  return { items, loading, loadingMore, error, hasMore, total, loadMore };
}
