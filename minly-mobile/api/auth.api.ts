import type { User } from "../types/user";
import { api } from "./apiClient";

export type AuthResponse = {
  token: string;
  user: User;
};

export const AuthAPI = {
  login(payload: { email: string; password: string }) {
    return api.post<AuthResponse>("/auth/login", payload);
  },

  register(payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    return api.post<AuthResponse>("/auth/register", payload);
  },

  me() {
    return api.get<{ user: User }>("/auth/me");
  },
};
