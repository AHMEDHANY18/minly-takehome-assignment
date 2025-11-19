import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
  // لو عندك حقول تانية من الباكند زوّدها هنا
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem("token");
    set({ user: null });
  },
}));
