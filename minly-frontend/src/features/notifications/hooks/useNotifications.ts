import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import {
  NotificationsAPI,
  type NotificationItem,
  type NotificationType,
} from "@/features/notifications/api/notifications.api";

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
      } catch (error) {
        setError(getErrorMessage(error, "Failed to load notifications."));
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
    setItems((prev) => prev.map((n) => (n.isRead ? n : { ...n, isRead: true })));

    try {
      await NotificationsAPI.readAll();
    } catch (error) {
      setError(getErrorMessage(error, "Failed to mark all as read."));
      await fetchPage(1, "replace");
    }
  }, [fetchPage]);

  const markRead = useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );

      try {
        await NotificationsAPI.markRead(id);
      } catch (error) {
        setError(getErrorMessage(error, "Failed to mark as read."));
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
    setItems,
  };
}

export function normalizeType(type: string): NotificationType | "SYSTEM" | string {
  return type || "SYSTEM";
}

export function matchesTab(type: string, tab: NotificationsTab) {
  if (tab === "ALL") return true;
  return type === tab;
}

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return (
    axiosError.response?.data?.message ??
    (error instanceof Error ? error.message : fallback)
  );
}
