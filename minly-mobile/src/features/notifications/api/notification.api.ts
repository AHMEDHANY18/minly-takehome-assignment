import { api } from "@/api/client";

export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW" | "SYSTEM";


export type NotificationItem = {
  id: string;
  type: NotificationType | string;

  actorId: string | null;
  targetUserId: string;

  mediaId: string | null;
  commentId: string | null;
  followId: string | null;

  isRead: boolean;
  createdAt: string;

  actor?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;

  media?: {
    id: string;
    thumbnailUrl: string | null;
    url: string | null;
  } | null;

  comment?: {
    id: string;
    text: string;
  } | null;

  follow?: {
    followerId: string;
    followingId: string;
  } | null;
};

export type NotificationsResponse = {
  status: "success" | "error";
  data: NotificationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export const NotificationsAPI = {
  list(params?: { page?: number; limit?: number }) {
    return api.get<NotificationsResponse>("/notification", { params });
  },

  readAll() {
    return api.patch("/notification/read-all");
  },

  markRead(id: string) {
    return api.patch(`/notification/${id}/read`);
  },
};
