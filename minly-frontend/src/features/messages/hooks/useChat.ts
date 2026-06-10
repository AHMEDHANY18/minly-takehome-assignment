import { useCallback, useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import {
  MessagesAPI,
  type MessageItem,
} from "@/features/messages/api/messages.api";
import { useMessagesStore } from "@/features/messages/store/messages.store";

/**
 * Chat thread state: messages ordered oldest → newest (newest at bottom),
 * load-older via cursor, optimistic send, mark-read on open and on incoming.
 */
export function useChat(conversationId: string | undefined, limit = 30) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastEvent = useMessagesStore((s) => s.lastEvent);
  const addUnread = useMessagesStore((s) => s.addUnread);

  const handledEventAt = useRef(0);

  const markRead = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await MessagesAPI.markRead(conversationId);
      const readCount = res.data.data?.readCount ?? 0;
      if (readCount > 0) addUnread(-readCount);
    } catch {
      // non-fatal
    }
  }, [conversationId, addUnread]);

  // initial load + mark read on open
  useEffect(() => {
    if (!conversationId) return;
    let alive = true;

    setInitialLoading(true);
    setError(null);
    setMessages([]);
    setNextCursor(null);

    MessagesAPI.messages(conversationId, { limit })
      .then((res) => {
        if (!alive) return;
        const d = res.data.data;
        // API returns newest first → reverse so newest is at the bottom
        setMessages([...(d.messages ?? [])].reverse());
        setNextCursor(d.nextCursor ?? null);
      })
      .catch((error: AxiosError<{ message?: string }>) => {
        if (!alive) return;
        setError(error.response?.data?.message ?? "Failed to load messages.");
      })
      .finally(() => {
        if (!alive) return;
        setInitialLoading(false);
      });

    markRead();

    return () => {
      alive = false;
    };
  }, [conversationId, limit, markRead]);

  // realtime: append incoming messages for this conversation
  useEffect(() => {
    if (!lastEvent || !conversationId) return;
    if (lastEvent.conversationId !== conversationId) return;
    if (lastEvent.receivedAt === handledEventAt.current) return;
    handledEventAt.current = lastEvent.receivedAt;

    setMessages((prev) =>
      prev.some((m) => m.id === lastEvent.message.id)
        ? prev
        : [...prev, lastEvent.message]
    );

    // we are looking at the thread → immediately mark read
    markRead();
  }, [lastEvent, conversationId, markRead]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || !nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await MessagesAPI.messages(conversationId, {
        limit,
        cursor: nextCursor,
      });
      const d = res.data.data;
      setMessages((prev) => {
        const older = [...(d.messages ?? [])].reverse();
        const known = new Set(prev.map((m) => m.id));
        return [...older.filter((m) => !known.has(m.id)), ...prev];
      });
      setNextCursor(d.nextCursor ?? null);
    } catch {
      // keep cursor; user can retry by scrolling again
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, nextCursor, loadingOlder, limit]);

  const send = useCallback(
    async (text: string, senderId: string) => {
      if (!conversationId) return false;
      const trimmed = text.trim();
      if (!trimmed) return false;

      const tempId = `temp-${crypto.randomUUID()}`;
      const optimistic: MessageItem = {
        id: tempId,
        conversationId,
        senderId,
        text: trimmed,
        mediaUrl: null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setSending(true);
      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await MessagesAPI.send(conversationId, trimmed);
        const saved = res.data.data.message;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? saved : m))
        );
        return true;
      } catch (error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const ax = error as AxiosError<{ message?: string }>;
        setError(ax.response?.data?.message ?? "Failed to send message.");
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  return {
    messages,
    hasOlder: !!nextCursor,
    initialLoading,
    loadingOlder,
    sending,
    error,
    setError,
    loadOlder,
    send,
  };
}
