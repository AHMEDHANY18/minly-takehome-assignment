import { api } from "./axios";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export const AuthAPI = {
  login: (data: LoginPayload) => api.post("/auth/login", data),
  register: (data: RegisterPayload) => api.post("/auth/register", data),
  getMe: () => api.get("/v1/users/me/profile"),
};
