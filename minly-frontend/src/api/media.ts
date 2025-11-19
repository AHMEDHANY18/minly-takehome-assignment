// src/api/media.ts
import { api } from "./axios";

export type MediaItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: "image" | "video" | "IMAGE" | "VIDEO";
  title: string | null;
  description: string | null;
  likesCount: number;
  createdAt: string;
  updatedAt?: string;

  uploader: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    mediaCount?: number;
    totalLikesReceived?: number;
    totalLikesGiven?: number;
    createdAt?: string;
    updatedAt?: string;
  };

  isLikedByCurrentUser?: boolean;
};

export const MediaAPI = {
  /** Global feed */
  getFeed(page: number, limit: number) {
    return api.get("/media", {
      params: { page, limit },
    });
  },

  /** User media (profile) */
  getUserMedia(userId: string, page = 1, limit = 50) {
    return api.get("/media", {
      params: { page, limit, uploaderId: userId },
    });
  },

  /** Upload media */
  uploadMedia(params: { file: File; title?: string; description?: string }) {
    const form = new FormData();
    form.append("file", params.file);
    if (params.title) form.append("title", params.title);
    if (params.description) form.append("description", params.description);

    return api.post("/media", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** Like / Unlike */
  toggleLike(mediaId: string) {
    return api.post(`/v1/like/${mediaId}`);
  },
};
