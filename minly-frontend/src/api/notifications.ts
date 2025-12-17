import { api } from "./axios";

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


export type NotificationListResponse = {
    status: "success";
    data: NotificationItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
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
export const NotificationAPI = {
  list(page = 1, limit = 20) {
    return api.get<NotificationListResponse>("/notification", { params: { page, limit } });
  },
  readAll() {
    return api.post("/notification/read-all");
  },
};
export const NotificationsAPI = {
  list(params?: { page?: number; limit?: number }) {
    return api.get<NotificationsResponse>("/notification", { params });
  },

  readAll() {
    // بناءً على مثال الريسبونس عندك
    return api.patch("/notification/read-all");
  },

  markRead(id: string) {
    return api.patch(`/notification/${id}/read`);

  },
};
