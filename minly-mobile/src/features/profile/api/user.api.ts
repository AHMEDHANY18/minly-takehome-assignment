// src/features/profile/api/user.api.ts
import { api } from "@/api/client";

export type ProfileUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type UpdateMeBody = {
  name?: string;
  avatarKey?: string;
};

export type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    mediaCount: number;
    followerCount: number;
    followingCount: number;
    totalLikesReceived: number;
    totalLikesGiven: number;
    createdAt: string;
    updatedAt: string;
  };
};

export const UserAPI = {
  // ✅ JSON update (name/avatarKey)
  updateMe(body: UpdateMeBody) {
    return api.patch<{ status: "success"; data: ProfileUser }>("/user", body);
  },

  // ✅ Multipart update (name + file)
  updateMeFormData(form: FormData) {
    return api.patch<{ status: "success"; data: ProfileUser }>("/user", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getMe() {
    return api.get<MeResponse>("/auth/me");
  },
};
