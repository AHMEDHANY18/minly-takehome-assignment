// src/api/auth.ts
import { api } from "./axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL");
}

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

export const AuthAPI = {
  // redirect → backend (BFF)
  startLogin() {
    // يعتمد على أن baseURL فيه /v1
    window.location.href = `${API_BASE_URL}/auth/login`;
  },

  // cookies-based
  me() {
    return api.get<MeResponse>("/auth/me");
  },

  // optional: لو عايز تنادي refresh يدويًا (مش ضروري مع interceptor)
  refresh() {
    return api.post("/auth/refresh");
  },

  // logout عبر الباك عشان يمسح cookies + يعمل redirect لـ Cognito logout
  startLogout() {
    window.location.href = `${API_BASE_URL}/auth/logout`;
  },
};
