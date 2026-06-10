// src/features/stories/store/stories.store.ts
import { create } from "zustand";

import { StoriesAPI, type StoryGroup } from "@/features/stories/api/stories.api";
import { UserAPI } from "@/features/profile/api/user.api";

type StoriesState = {
  groups: StoryGroup[];
  meId: string | null;
  meAvatarUrl: string | null;

  loading: boolean;
  loaded: boolean;
  error: string | null;

  /** Fetch /story/feed (+ /auth/me once) and replace groups. */
  load: () => Promise<void>;

  /** Mark a story as viewed locally (keeps rings in sync without refetching). */
  markViewedLocal: (userId: string, storyId: string) => void;

  /** Remove a deleted story locally; drops the group if it becomes empty. */
  removeStoryLocal: (userId: string, storyId: string) => void;
};

export const useStoriesStore = create<StoriesState>((set, get) => ({
  groups: [],
  meId: null,
  meAvatarUrl: null,

  loading: false,
  loaded: false,
  error: null,

  load: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });

    try {
      const needMe = !get().meId;

      const [groups, meRes] = await Promise.all([
        StoriesAPI.feed(),
        needMe ? UserAPI.getMe().catch(() => null) : Promise.resolve(null),
      ]);

      set((s) => ({
        groups,
        loaded: true,
        meId: meRes?.data?.user?.id ?? s.meId,
        meAvatarUrl: meRes?.data?.user?.avatarUrl ?? s.meAvatarUrl,
      }));
    } catch (e: any) {
      set({
        error: e?.response?.data?.message ?? e?.message ?? "Failed to load stories",
        loaded: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  markViewedLocal: (userId, storyId) => {
    set((s) => ({
      groups: s.groups.map((g) => {
        if (g.user.id !== userId) return g;
        const stories = g.stories.map((st) =>
          st.id === storyId ? { ...st, viewed: true } : st
        );
        return { ...g, stories, allViewed: stories.every((st) => st.viewed) };
      }),
    }));
  },

  removeStoryLocal: (userId, storyId) => {
    set((s) => ({
      groups: s.groups
        .map((g) => {
          if (g.user.id !== userId) return g;
          const stories = g.stories.filter((st) => st.id !== storyId);
          return { ...g, stories, allViewed: stories.every((st) => st.viewed) };
        })
        .filter((g) => g.stories.length > 0),
    }));
  },
}));
