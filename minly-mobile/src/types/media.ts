export type MediaItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO" | "image" | "video";
  title: string | null;
  description: string | null;
  likesCount: number;
  createdAt: string;
  updatedAt?: string;
  isLikedByCurrentUser?: boolean;
  uploader?: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
  };
};
