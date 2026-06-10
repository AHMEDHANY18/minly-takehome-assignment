// src/features/messages/hooks/useChat.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { MessagesAPI, type ChatMessage } from "../api/messages.api";
import { UserAPI } from "@/features/profile/api/user.api";

function mergeNewestFirst(prev: ChatMessage[], incoming: ChatMessage[]) {
  const map = new Map<string, ChatMessage>();
  for (const m of prev) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, m);
  return Array.from(map.values()).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
}

/**
 * Chat state for one conversation.
 * - messages are newest-first (for an inverted FlatList)
 * - poll() is called every 5s by the screen while focused (SSE fallback per contract §8)
 */
export function useChat(conversationId: string, pageSize = 30) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [meId, setMeId] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextCursorRef = useRef<string | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const pollingRef = useRef(false);

  const loadFirst = useCallback(async () => {
    setInitialLoading(true);
    setError(null);

    try {
      const [pageRes, meRes] = await Promise.allSettled([
        MessagesAPI.listMessages(conversationId, { limit: pageSize }),
        UserAPI.getMe(),
      ]);

      if (pageRes.status === "fulfilled") {
        setMessages(mergeNewestFirst([], pageRes.value.messages ?? []));
        nextCursorRef.current = pageRes.value.nextCursor ?? null;
        setHasOlder(!!pageRes.value.nextCursor);
      } else {
        throw pageRes.reason;
      }

      if (meRes.status === "fulfilled") {
        setMeId(meRes.value.data.user.id);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load messages");
    } finally {
      setInitialLoading(false);
    }
  }, [conversationId, pageSize]);

  /** Refetch the newest page and merge (5s poll fallback). */
  const poll = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;

    try {
      const res = await MessagesAPI.listMessages(conversationId, { limit: pageSize });
      setMessages((prev) => mergeNewestFirst(prev, res.messages ?? []));
    } catch {
      // silent — next tick will retry
    } finally {
      pollingRef.current = false;
    }
  }, [conversationId, pageSize]);

  /** Cursor pagination: load older messages (top of inverted list). */
  const loadOlder = useCallback(async () => {
    if (loadingOlder) return;
    const cursor = nextCursorRef.current;
    if (!cursor) return;

    setLoadingOlder(true);

    try {
      const res = await MessagesAPI.listMessages(conversationId, {
        cursor,
        limit: pageSize,
      });

      nextCursorRef.current = res.nextCursor ?? null;
      setHasOlder(!!res.nextCursor);
      setMessages((prev) => mergeNewestFirst(prev, res.messages ?? []));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load older messages");
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, pageSize, loadingOlder]);

  /** Optimistic send: temp bubble first, replaced by the server message. */
  const send = useCallback(
    async (text: string) => {
      const v = text.trim();
      if (!v || sending) return false;

      setSending(true);

      const temp: ChatMessage = {
        id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        conversationId,
        senderId: meId ?? "me",
        text: v,
        mediaUrl: null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [temp, ...prev]);

      try {
        const real = await MessagesAPI.sendMessage(conversationId, v);
        setMessages((prev) =>
          mergeNewestFirst(prev.filter((m) => m.id !== temp.id), [real])
        );
        return true;
      } catch (e: any) {
        // rollback
        setMessages((prev) => prev.filter((m) => m.id !== temp.id));
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to send message");
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversationId, meId, sending]
  );

  const markRead = useCallback(async () => {
    try {
      await MessagesAPI.markRead(conversationId);
    } catch {
      // ignore
    }
  }, [conversationId]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  const isMine = useCallback(
    (m: ChatMessage) =>
      (meId != null && m.senderId === meId) || m.id.startsWith("temp-"),
    [meId]
  );

  return {
    messages,
    meId,
    isMine,

    initialLoading,
    loadingOlder,
    sending,
    error,
    hasOlder,

    loadFirst,
    loadOlder,
    poll,
    send,
    markRead,
  };
}
