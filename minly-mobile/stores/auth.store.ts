import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { setApiAccessToken, api } from "../api/apiClient";

type AuthStatus = "booting" | "guest" | "authed";
const KEY = "access_token";

export const useAuthStore = create<{
  status: AuthStatus;
  token: string | null;

  bootstrap: () => Promise<void>;
  setToken: (t: string) => Promise<void>;
  logout: () => Promise<void>;
}>((set) => ({
  status: "booting",
  token: null,

  bootstrap: async () => {
    set({ status: "booting" });

    const token = await SecureStore.getItemAsync(KEY);
    console.log("TOKEN?", token?.slice(0, 20));

    if (!token) {
      setApiAccessToken(null);
      set({ status: "guest", token: null });
      return;
    }

    setApiAccessToken(token);
    set({ token });

    try {
      await api.get("/auth/me"); // verify token
      set({ status: "authed" });
    } catch (e) {
      await SecureStore.deleteItemAsync(KEY);
      setApiAccessToken(null);
      set({ status: "guest", token: null });
    }
  },

  setToken: async (t) => {
    await SecureStore.setItemAsync(KEY, t);
    setApiAccessToken(t);
    set({ status: "authed", token: t });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(KEY);
    setApiAccessToken(null);
    set({ status: "guest", token: null });
  },
}));
