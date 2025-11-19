import { api } from "./axios";

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
};

export const MediaAPI = {
  getFeed(page: number, limit: number) {
    return api.get("/media", { params: { page, limit } });
  },

  uploadMedia(payload: { file: File; title?: string; description?: string }) {
    const form = new FormData();
    form.append("file", payload.file);
    if (payload.title) form.append("title", payload.title);
    if (payload.description) form.append("description", payload.description);

    return api.post("/media", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  toggleLike(mediaId: string) {
    return api.post(`/like/${mediaId}`);
  },
};
