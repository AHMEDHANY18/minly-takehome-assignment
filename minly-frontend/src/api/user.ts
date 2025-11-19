// src/api/user.ts
import { api } from "./axios";
import type { MediaItem } from "./media";

export type MeData = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  mediaCount: number;
  totalLikesReceived: number;
  totalLikesGiven: number;
  createdAt: string;
  media: MediaItem[];
};

export const UserAPI = {
  // GET /v1/user/me  (baseURL غالبًا فيه /v1 بالفعل)
  getMe() {
    return api.get<{ status: string; data: MeData }>("/user/me");
  },
  getById(userId: string) {
    return api.get<{ status: string; data: MeData }>(`/user/${userId}`);
  },
  // PATCH /v1/user  (update profile: name, email, file)
  updateMe(params: { name?: string; email?: string; file?: File }) {
    const form = new FormData();

    if (params.name) form.append("name", params.name);
    if (params.email) form.append("email", params.email);
    if (params.file) form.append("file", params.file);

    return api.patch<{ status: string; data: MeData }>("/user", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
