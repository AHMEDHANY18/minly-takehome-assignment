import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import {
  MessagesAPI,
  type ConversationItem,
} from "@/features/messages/api/messages.api";
import { useMessagesStore } from "@/features/messages/store/messages.store";

export function useConversations(limit = 20) {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastEvent = useMessagesStore((s) => s.lastEvent);

  const fetchPage = useCallback(
    async (p: number, mode: "replace" | "append") => {
      try {
        setError(null);
        const res = await MessagesAPI.list(p, limit);
        const d = res.data.data;

        setHasMore(!!d.hasMore);
        setItems((prev) =>
          mode === "append" ? [...prev, ...d.conversations] : d.conversations
        );
        setPage(p);
      } catch (error) {
        const ax = error as AxiosError<{ message?: string }>;
        setError(ax.response?.data?.message ?? "Failed to load conversations.");
      }
    },
    [limit]
  );

  useEffect(() => {
    setInitialLoading(true);
    fetchPage(1, "replace").finally(() => setInitialLoading(false));
  }, [fetchPage]);

  // realtime: bump conversation on incoming MESSAGE
  useEffect(() => {
    if (!lastEvent) return;

    setItems((prev) => {
      const { conversationId, message } = lastEvent;
      const existing = prev.find((c) => c.id === conversationId);

      if (!existing) {
        // unknown conversation → refetch first page silently
        fetchPage(1, "replace");
        return prev;
      }

      const updated: ConversationItem = {
        ...existing,
        lastMessage: {
          id: message.id,
          text: message.text,
          mediaUrl: message.mediaUrl,
          senderId: message.senderId,
          createdAt: message.createdAt,
        },
        lastMessageAt: message.createdAt,
        unreadCount: existing.unreadCount + 1,
      };

      return [updated, ...prev.filter((c) => c.id !== conversationId)];
    });
  }, [lastEvent, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || initialLoading) return;
    setLoadingMore(true);
    await fetchPage(page + 1, "append").finally(() => setLoadingMore(false));
  }, [fetchPage, hasMore, loadingMore, initialLoading, page]);

  const markConversationReadLocal = useCallback((conversationId: string) => {
    setItems((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, []);

  return {
    items,
    hasMore,
    initialLoading,
    loadingMore,
    error,
    loadMore,
    reload: () => fetchPage(1, "replace"),
    markConversationReadLocal,
  };
}
