import { api } from "@/shared/api/http";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://minly-takehome-assignment.onrender.com/v1";

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
  startLogin() {
    window.location.href = `${API_BASE_URL}/auth/login`;
  },

  me() {
    return api.get<MeResponse>("/auth/me");
  },

  refresh() {
    return api.post("/auth/refresh");
  },

  startLogout() {
    window.location.href = `${API_BASE_URL}/auth/logout`;
  },
};
