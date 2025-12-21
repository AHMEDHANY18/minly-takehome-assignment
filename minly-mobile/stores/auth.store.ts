import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { AuthAPI } from "../api/auth.api";
import type { User } from "../types/user";

type Status = "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  status: Status;
  user: User | null;
  bootstrap: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,

  bootstrap: async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        set({ status: "unauthenticated", user: null });
        return;
      }

      // optional: verify token by calling /auth/me
      const res = await AuthAPI.me();
      set({ status: "authenticated", user: res.data.user ?? null });
    } catch {
      await SecureStore.deleteItemAsync("token");
      set({ status: "unauthenticated", user: null });
    }
  },

  setSession: async (token, user) => {
    await SecureStore.setItemAsync("token", token);
    set({ status: "authenticated", user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    set({ status: "unauthenticated", user: null });
  },
}));
