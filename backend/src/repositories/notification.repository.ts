import { prisma } from "../config/prisma";
import { NotificationStream } from "../realtime/notification.stream";
import { NotificationTypeConst } from "../config/constant";

export const NotificationRepository = {
  // -----------------------------
  // CREATE + REALTIME PUSH
  // -----------------------------
  async create(data: {
    type: NotificationTypeConst;
    actorId: string;
    targetUserId: string;
    mediaId?: string | null;
    commentId?: string | null;
    followId?: string | null;
  }) {
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        actorId: data.actorId,
        targetUserId: data.targetUserId,
        mediaId: data.mediaId ?? null,
        commentId: data.commentId ?? null,
        followId: data.followId ?? null,
      },
    });

    // 🔥 realtime push
    NotificationStream.emit(data.targetUserId, notification);

    return notification;
  },

  // -----------------------------
  // LIST (pagination + filters)
  // -----------------------------
  async listForUser(
    userId: string,
    pagination: { page: number; limit: number },
    filters?: {
      type?: NotificationTypeConst;
      isRead?: boolean;
      q?: string; // ✅ ضفناها
    }
  ) {
    const skip = (pagination.page - 1) * pagination.limit;

    const where: any = {
      targetUserId: userId,
    };

    if (filters?.type) where.type = filters.type;
    if (typeof filters?.isRead === "boolean")
      where.isRead = filters.isRead;

    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pagination.limit,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          media: {
            select: {
              id: true,
              thumbnailUrl: true,
              url: true,
            },
          },
          comment: {
            select: {
              id: true,
              text: true,
            },
          },
          follow: {
            select: {
              followerId: true,
              followingId: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return { items, total };
  },

  // -----------------------------
  // MARK ONE AS READ
  // -----------------------------
  async markRead(userId: string, notificationId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        targetUserId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return result.count > 0;
  },

  // -----------------------------
  // MARK ALL AS READ
  // -----------------------------
  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        targetUserId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return result.count;
  },

  // -----------------------------
  // UNREAD COUNT
  // -----------------------------
  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        targetUserId: userId,
        isRead: false,
      },
    });
  },
};
