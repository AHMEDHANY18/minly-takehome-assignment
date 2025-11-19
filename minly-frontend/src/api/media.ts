import { api } from "./axios"; // أو مسار الـ axios instance عندك

export type MediaItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO";
  title: string | null;
  description: string | null;
  likesCount: number;
  createdAt: string;
  uploader: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  isLikedByCurrentUser?: boolean;
};

export const MediaAPI = {
  getFeed(page: number, limit: number) {
    return api.get("/media", { params: { page, limit } });
  },

  // NEW: toggle like endpoint
  toggleLike(mediaId: string) {
    return api.post(`/like/${mediaId}`);
  },
};
