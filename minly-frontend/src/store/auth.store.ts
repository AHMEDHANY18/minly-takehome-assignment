import { create } from "zustand";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";

interface AuthStore {
  status: AuthStatus;
  setAuthenticated: () => void;
  setUnauthenticated: () => void;
  setLoading: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: "loading",

  setLoading: () => set({ status: "loading" }),
  setAuthenticated: () => set({ status: "authenticated" }),
  setUnauthenticated: () => set({ status: "unauthenticated" }),
}));
