import type { AxiosResponse } from "axios";
import { apiClient } from "./apiClient";
import type { User } from "../types/user";

export type AuthResponse = {
  token?: string;
  user?: User;
  data?: {
    token?: string;
    user?: User;
  };
};

export const AuthAPI = {
  checkEmail(email: string): Promise<AxiosResponse<{ exists: boolean }>> {
    return apiClient.post<{ exists: boolean }>("/auth/check-email", { email });
  },
  login(payload: { email: string; password: string }): Promise<AxiosResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>("/auth/login", payload);
  },
  register(payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<AxiosResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>("/auth/register", payload);
  },
};
