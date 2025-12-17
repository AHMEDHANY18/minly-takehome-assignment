import { create } from "zustand";

export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW" | "SYSTEM";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;

  actor?: { id: string; name: string; avatarUrl: string | null } | null;

  media?: { id: string; thumbnailUrl: string | null } | null;
  comment?: { id: string; text: string } | null;
  follow?: { followerId: string; followingId: string } | null;
};

type NotificationStore = {
  items: NotificationItem[];
  unread: number;
  connected: boolean;

  setInitial: (items: NotificationItem[]) => void;
  pushIncoming: (n: NotificationItem) => void;

  markAllReadLocal: () => void;
  markReadLocal: (id: string) => void;

  setConnected: (v: boolean) => void;
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  items: [],
  unread: 0,
  connected: false,

  setConnected: (v) => set({ connected: v }),

  setInitial: (items) => {
    const unread = items.filter((x) => !x.isRead).length;
    set({ items, unread });
  },

  pushIncoming: (n) => {
    const prev = get().items;

    // dedupe by id
    if (prev.some((x) => x.id === n.id)) return;

    const next = [n, ...prev];
    set({
      items: next,
      unread: get().unread + (n.isRead ? 0 : 1),
    });
  },

  markAllReadLocal: () => {
    const next = get().items.map((x) => ({ ...x, isRead: true }));
    set({ items: next, unread: 0 });
  },

  markReadLocal: (id) => {
    const prev = get().items;
    const before = prev.find((x) => x.id === id);

    const next = prev.map((x) => (x.id === id ? { ...x, isRead: true } : x));

    set({
      items: next,
      unread: Math.max(0, get().unread - (before && !before.isRead ? 1 : 0)),
    });
  },
}));
