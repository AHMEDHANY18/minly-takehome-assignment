export type User = {
  id: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  mediaCount?: number;
  totalLikesReceived?: number;
  totalLikesGiven?: number;
};
