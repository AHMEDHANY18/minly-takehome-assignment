import { NotificationType } from "@prisma/client";
import { NotificationRepository } from "../../repositories/notification.repository";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function listNotificationsService(params: {
  userId: string;
  page?: string;
  limit?: string;
  type?: string;
  isRead?: string;
  q?: string;
}) {
  const page = clamp(Number(params.page ?? 1) || 1, 1, 10_000);
  const limit = clamp(Number(params.limit ?? 20) || 20, 1, 50);

  let type: NotificationType | undefined;
  if (params.type) {
    const t = params.type.toUpperCase();
    if (["LIKE", "COMMENT", "FOLLOW", "SYSTEM"].includes(t)) {
      type = t as NotificationType;
    } else {
      const err: any = new Error("Invalid notification type");
      err.status = 400;
      throw err;
    }
  }

  let isRead: boolean | undefined;
  if (typeof params.isRead === "string") {
    if (params.isRead === "true") isRead = true;
    else if (params.isRead === "false") isRead = false;
    else {
      const err: any = new Error("Invalid isRead value");
      err.status = 400;
      throw err;
    }
  }

  const { items, total } = await NotificationRepository.listForUser(
    params.userId,
    { page, limit },
    { type, isRead, q: params.q }
  );

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
