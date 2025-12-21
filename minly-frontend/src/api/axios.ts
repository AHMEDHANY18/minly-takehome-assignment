// src/api/axios.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useUserStore } from "../store/user.store";
import { useAuthStore } from "../store/auth.store";

// const baseURL = import.meta.env.VITE_API_BASE_URL;
const baseURL = "https://minly-takehome-assignment.onrender.com/v1"

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// axios instance بدون interceptor عشان نستخدمه في refresh بدون loop
const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let waiters: Array<(ok: boolean) => void> = [];

function notifyWaiters(ok: boolean) {
  waiters.forEach((fn) => fn(ok));
  waiters = [];
}

function hardLogout() {
  useUserStore.getState().clearUser();
  useAuthStore.getState().setUnauthenticated();

  // avoid redirect loop if already on login
  if (!window.location.pathname.startsWith("/login")) {
    window.location.replace("/login");
  }
}

function isAuthExcluded(url?: string) {
  if (!url) return false;
  // لا تعمل refresh على refresh نفسه أو login/logout/callback
  return (
    url.includes("/auth/refresh") ||
    url.includes("/auth/login") ||
    url.includes("/auth/logout") ||
    url.includes("/auth/callback")
  );
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    if (status !== 401) return Promise.reject(error);

    const original = error.config as RetryConfig | undefined;
    const url = original?.url;

    if (!original) {
      hardLogout();
      return Promise.reject(error);
    }

    // لو ده request auth حسّاس، متدخلش refresh loop
    if (isAuthExcluded(url)) {
      hardLogout();
      return Promise.reject(error);
    }

    // امنع retry لا نهائي
    if (original._retry) {
      hardLogout();
      return Promise.reject(error);
    }
    original._retry = true;

    // لو في refresh شغال، استنى نتيجته
    if (isRefreshing) {
      const ok = await new Promise<boolean>((resolve) => waiters.push(resolve));
      if (!ok) {
        hardLogout();
        return Promise.reject(error);
      }
      return api(original);
    }

    // ابدأ refresh
    isRefreshing = true;
    try {
      await refreshClient.post("/auth/refresh"); // sets new access_token cookie
      notifyWaiters(true);
      return api(original); // retry original request
    } catch (e) {
      notifyWaiters(false);
      hardLogout();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);
