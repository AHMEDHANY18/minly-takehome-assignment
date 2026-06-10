// src/features/stories/api/stories.api.ts
import { api } from "@/api/client";

export type StoryType = "IMAGE" | "VIDEO";

export type StoryItem = {
  id: string;
  url: string;
  type: StoryType;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
};

export type StoryGroup = {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  stories: StoryItem[];
  allViewed: boolean;
};

export type StoryViewerItem = {
  id: string;
  name: string;
  avatarUrl: string | null;
  viewedAt: string;
};

export const StoriesAPI = {
  // GET /v1/story/feed -> { groups } (own group first, then unviewed, then viewed)
  async feed(): Promise<StoryGroup[]> {
    const res = await api.get<{ status: "success"; data: { groups: StoryGroup[] } }>(
      "/story/feed"
    );
    return res.data.data?.groups ?? [];
  },

  // POST /v1/story  (url comes from the existing presign+PUT flow)
  create(body: { url: string; type: StoryType }) {
    return api.post<{ status: "success"; data: { story: StoryItem } }>("/story", body);
  },

  // POST /v1/story/:id/view
  markViewed(storyId: string) {
    return api.post<{ status: "success"; data: { storyId: string; viewed: true } }>(
      `/story/${storyId}/view`
    );
  },

  // GET /v1/story/:id/viewers (owner only)
  async viewers(storyId: string): Promise<{ viewers: StoryViewerItem[]; count: number }> {
    const res = await api.get<{
      status: "success";
      data: { viewers: StoryViewerItem[]; count: number };
    }>(`/story/${storyId}/viewers`);
    return res.data.data ?? { viewers: [], count: 0 };
  },

  // DELETE /v1/story/:id (owner only)
  remove(storyId: string) {
    return api.delete<{ status: "success" }>(`/story/${storyId}`);
  },
};
