// src/api/client.ts
import axios from "axios";
import { emitUnauthorized } from "./authEvents";

let accessToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://minly-takehome-assignment.onrender.com/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;

    // ✅ أي 401 في أي مكان => Logout + Redirect للـ Login
    if (status === 401) {
      void emitUnauthorized();
    }

    return Promise.reject(error);
  }
);
