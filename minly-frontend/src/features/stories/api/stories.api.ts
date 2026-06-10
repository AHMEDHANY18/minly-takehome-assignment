import { api, http } from "@/shared/api/http";
import { MediaAPI } from "@/features/media/api/media.api";
import { presignKind } from "@/shared/constant";

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
  user: { id: string; name: string; avatarUrl: string | null };
  stories: StoryItem[];
  allViewed: boolean;
};

export type StoryViewerEntry = {
  id: string;
  name: string;
  avatarUrl: string | null;
  viewedAt: string;
};

export const StoriesAPI = {
  feed() {
    return api.get<{ status: "success"; data: { groups: StoryGroup[] } }>(
      "/story/feed"
    );
  },

  create(body: { url: string; type: StoryType }) {
    return api.post<{ status: "success"; data: { story: StoryItem } }>(
      "/story",
      body
    );
  },

  markViewed(storyId: string) {
    return api.post<{
      status: "success";
      data: { storyId: string; viewed: true };
    }>(`/story/${storyId}/view`);
  },

  viewers(storyId: string) {
    return api.get<{
      status: "success";
      data: { viewers: StoryViewerEntry[]; count: number };
    }>(`/story/${storyId}/viewers`);
  },

  remove(storyId: string) {
    return api.delete<{ status: "success" }>(`/story/${storyId}`);
  },

  /**
   * Full story upload: presign → PUT to storage → POST /story.
   * Reuses the same presign flow as media uploads.
   */
  async upload(file: File): Promise<void> {
    const type: StoryType = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";

    const presignRes = await MediaAPI.presign({
      kind: presignKind.MEDIA,
      contentType: file.type,
      type,
    });
    const { uploadUrl, publicUrl } = presignRes.data.data;

    await http.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
    });

    await StoriesAPI.create({ url: publicUrl, type });
  },
};
