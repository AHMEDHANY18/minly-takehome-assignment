import { useCallback, useEffect, useMemo, useState } from "react";
import { NotificationsAPI, type NotificationItem } from "../api/notification.api";

function mergeUniqueById(prev: NotificationItem[], next: NotificationItem[]) {
  const map = new Map<string, NotificationItem>();
  for (const x of prev) map.set(x.id, x);
  for (const x of next) map.set(x.id, x);
  return Array.from(map.values()).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
}

export function useNotifications(limit = 20) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const hasMore = pagination.hasNext;

  const unreadCount = useMemo(
    () => items.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0),
    [items]
  );

  const fetchPage = useCallback(
    async (p: number, mode: "replace" | "append") => {
      const res = await NotificationsAPI.list({ page: p, limit });
      const payload = res.data;

      if (payload.status !== "success") {
        throw new Error("Failed to load notifications");
      }

      setPagination(payload.pagination);

      setItems((prev) =>
        mode === "replace"
          ? mergeUniqueById([], payload.data)
          : mergeUniqueById(prev, payload.data)
      );
    },
    [limit]
  );

  const reload = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      setPage(1);
      await fetchPage(1, "replace");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load");
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    if (!hasMore) return;

    const nextPage = page + 1;

    try {
      setLoadingMore(true);
      setError(null);
      await fetchPage(nextPage, "append");
      setPage(nextPage);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadingMore, page]);

  const markReadLocal = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllReadLocal = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const markRead = useCallback(
    async (id: string) => {
      // optimistic
      markReadLocal(id);
      try {
        await NotificationsAPI.markRead(id);
      } catch {
        // لو حبيت تعمل rollback هنا، سيبها حالياً بسيطة
      }
    },
    [markReadLocal]
  );

  const readAll = useCallback(async () => {
    // optimistic
    markAllReadLocal();
    try {
      await NotificationsAPI.readAll();
    } catch {
      // rollback optional
    }
  }, [markAllReadLocal]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    items,
    pagination,
    unreadCount,

    initialLoading,
    refreshing,
    loadingMore,
    error,
    hasMore,

    reload,
    loadMore,

    markRead,
    readAll,
  };
}
