import { api } from "@/shared/api/http";

export type BlockedUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  blockedAt: string;
};

type Envelope<T> = { status: "success"; data: T };

export const BlockAPI = {
  /** toggle block for userId */
  toggle(userId: string) {
    return api.post<Envelope<{ userId: string; isBlocked: boolean }>>(
      `/block/${userId}`
    );
  },

  list() {
    return api.get<Envelope<{ users: BlockedUser[] }>>("/block");
  },
};
