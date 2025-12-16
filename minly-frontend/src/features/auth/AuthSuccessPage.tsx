import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;

  // optional: لو عايز تستخدمها من UI
  logoutLocal: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null, // Source of truth is /v1/auth/me (cookies), not localStorage

  setUser: (user) => set({ user }),

  clearUser: () => set({ user: null }),

  logoutLocal: () => set({ user: null }),
}));
