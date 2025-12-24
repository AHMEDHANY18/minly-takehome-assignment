import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;

  mediaCount: number;
  followerCount: number;
  followingCount: number;

  totalLikesReceived: number;
  totalLikesGiven: number;

  createdAt: string;
  updatedAt: string;
}


interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  clearUser: () => set({ user: null }),
}));
