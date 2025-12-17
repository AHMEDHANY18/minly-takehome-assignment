import { useCallback, useEffect, useMemo, useState } from "react";
import {
  NotificationsAPI,
  type NotificationItem,
  type NotificationType,
} from "../../../api/notifications";

export type NotificationsTab = "ALL" | "LIKE" | "COMMENT" | "FOLLOW" | "SYSTEM";

export function useNotifications(limit = 20) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (p: number, mode: "replace" | "append") => {
      try {
        setError(null);
        const res = await NotificationsAPI.list({ page: p, limit });

        const data = res.data.data ?? [];
        const pag = res.data.pagination;

        setHasMore(!!pag?.hasNext);
        setItems((prev) => (mode === "append" ? [...prev, ...data] : data));
        setPage(p);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Failed to load notifications.");
      }
    },
    [limit]
  );

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

  const unreadCount = useMemo(
    () => items.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0),
    [items]
  );

  const markAllRead = useCallback(async () => {
    // ✅ Optimistic UI
    setItems((prev) => prev.map((n) => (n.isRead ? n : { ...n, isRead: true })));

    try {
      await NotificationsAPI.readAll(); // MUST hit: POST /notification/read-all
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to mark all as read.");
      // رجّع البيانات من الباك عشان تظبط الحالة
      await fetchPage(1, "replace");
    }
  }, [fetchPage]);

  const markRead = useCallback(
    async (id: string) => {
      // ✅ Optimistic UI
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );

      try {
        await NotificationsAPI.markRead(id); // MUST hit: POST/PATCH /notification/:id/read
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Failed to mark as read.");
        // optional: sync from server
        await fetchPage(1, "replace");
      }
    },
    [fetchPage]
  );

  return {
    items,
    page,
    hasMore,
    initialLoading,
    loadingMore,
    error,
    reload,
    loadMore,
    markAllRead,
    markRead,
    unreadCount,
    setItems, // useful for future optimistic updates
  };
}


export function normalizeType(type: string): NotificationType | "SYSTEM" | string {
  return type || "SYSTEM";
}

export function matchesTab(
  type: string,
  tab: NotificationsTab
) {
  if (tab === "ALL") return true;
  return type === tab;
}
