// api/axios.ts
import axios from "axios";
import { useUserStore } from "../store/user.store";
import { useAuthStore } from "../store/auth.store";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().clearUser();
      useAuthStore.getState().setUnauthenticated();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
