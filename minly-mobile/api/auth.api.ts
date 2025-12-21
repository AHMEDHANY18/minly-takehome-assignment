import { apiClient } from "./apiClient";
import type { User } from "../types/user";

export type AuthResponse = {
  token: string;
  user: User;
};

export const AuthAPI = {
  login(payload: { email: string; password: string }) {
    return apiClient.post<AuthResponse>("/auth/login", payload);
  },

  register(payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    return apiClient.post<AuthResponse>("/auth/register", payload);
  },

  me() {
    return apiClient.get<{ user: User }>("/auth/me");
  },
};
