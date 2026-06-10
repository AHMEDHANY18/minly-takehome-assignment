import { create } from "zustand";
import type { MessageItem } from "@/features/messages/api/messages.api";

export type IncomingMessageEvent = {
  conversationId: string;
  message: MessageItem;
  receivedAt: number;
};

type MessagesStore = {
  /** total unread DM count (nav badge) */
  unread: number;
  /** latest realtime MESSAGE event (SSE) — pages subscribe to react */
  lastEvent: IncomingMessageEvent | null;

  setUnread: (n: number) => void;
  addUnread: (delta: number) => void;
  pushIncoming: (conversationId: string, message: MessageItem) => void;
};

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  unread: 0,
  lastEvent: null,

  setUnread: (n) => set({ unread: Math.max(0, n) }),

  addUnread: (delta) => set({ unread: Math.max(0, get().unread + delta) }),

  pushIncoming: (conversationId, message) =>
    set({
      unread: get().unread + 1,
      lastEvent: { conversationId, message, receivedAt: Date.now() },
    }),
}));
