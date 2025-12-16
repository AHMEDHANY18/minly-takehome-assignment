import { api } from "./axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const LOGOUT_REDIRECT = import.meta.env.VITE_COGNITO_LOGOUT_REDIRECT;

if (!COGNITO_DOMAIN || !CLIENT_ID || !LOGOUT_REDIRECT) {
  throw new Error("Missing Cognito env variables");
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
    window.location.href = `${API_BASE_URL}/auth/login`;
  },

  // cookies-based
  me() {
    return api.get<MeResponse>("/auth/me");
  },

  // redirect → Cognito logout
  startLogout() {
    window.location.href =
      `${COGNITO_DOMAIN}/logout` +
      `?client_id=${CLIENT_ID}` +
      `&logout_uri=${encodeURIComponent(LOGOUT_REDIRECT)}`;
  },
};
