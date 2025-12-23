import { useCallback, useEffect, useState } from "react";
import { BookmarksAPI, type SavedMedia, type SavedSort, type SavedType } from "../api/bookmarks";

export function useSavedItems(limit = 24) {
  const [items, setItems] = useState<SavedMedia[]>([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SavedSort>("recent");
  const [type, setType] = useState<SavedType | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNext, setHasNext] = useState(true);

  const load = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);

      const currentPage = reset ? 1 : page;

      try {
        const res = await BookmarksAPI.list({
          page: currentPage,
          limit,
          sort,
          type,
        });

        const data = res.data.data;
        const pagination = res.data.pagination;

        setItems((prev) => (reset ? data : [...prev, ...data]));
        setHasNext(pagination.hasNext);
        setPage(currentPage + 1);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, sort, type, limit, loading]
  );

  useEffect(() => {
    load(true);
  }, [sort, type]);

  return {
    items,
    loading,
    refreshing,
    hasNext,
    loadMore: () => hasNext && load(),
    refresh: () => {
      setRefreshing(true);
      load(true);
    },
    setSort,
    setType,
    sort,
    type,
  };
}
