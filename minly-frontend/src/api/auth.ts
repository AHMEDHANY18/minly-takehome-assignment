import type { AxiosResponse } from "axios";
import { api } from "./axios";
import type { User } from "../store/user.store";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string; // 👈 مهم جدًا

}

type AuthResponse = {
  token?: string;
  user?: User;
  data?: {
    token?: string;
    user?: User;
  };
};

export const AuthAPI = {
  login: (data: LoginPayload): Promise<AxiosResponse<AuthResponse>> =>
    api.post<AuthResponse>("/auth/login", data),
  register: (data: RegisterPayload): Promise<AxiosResponse<AuthResponse>> =>
    api.post<AuthResponse>("/auth/register", data),
  getMe: (): Promise<AxiosResponse<AuthResponse>> => api.get<AuthResponse>("/users/me/profile"),
  checkEmail: (email: string): Promise<AxiosResponse<{ exists: boolean }>> =>
    api.post<{ exists: boolean }>("/auth/check-email", { email }),

};
