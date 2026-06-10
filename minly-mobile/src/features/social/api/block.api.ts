// src/features/social/api/block.api.ts
import { api } from "@/api/client";

export type BlockedUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  blockedAt: string;
};

export const BlockAPI = {
  /** POST /block/:userId — toggle block */
  async toggle(userId: string) {
    const res = await api.post<{
      status: string;
      data: { userId: string; isBlocked: boolean };
    }>(`/block/${userId}`);
    return res.data.data;
  },

  /** GET /block — list of users I blocked */
  async list(): Promise<BlockedUser[]> {
    const res = await api.get<{
      status: string;
      data: { users: BlockedUser[] };
    }>("/block");
    return res.data.data?.users ?? [];
  },

  /** Helper: is this user blocked by me? */
  async isBlocked(userId: string): Promise<boolean> {
    const users = await this.list();
    return users.some((u) => u.id === userId);
  },
};
