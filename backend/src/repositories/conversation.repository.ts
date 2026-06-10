// src/repositories/conversation.repository.ts
import { prisma } from "../config/prisma";

const participantInclude = {
  participants: {
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
} as const;

export const ConversationRepository = {
  findOneToOne(userAId: string, userBId: string) {
    return prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userAId } } },
          { participants: { some: { userId: userBId } } },
        ],
      },
      include: participantInclude,
    });
  },

  createOneToOne(userAId: string, userBId: string) {
    return prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: userAId }, { userId: userBId }],
        },
      },
      include: participantInclude,
    });
  },

  findByIdWithParticipants(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: participantInclude,
    });
  },

  async listForUser(params: { userId: string; skip: number; take: number }) {
    const { userId, skip, take } = params;
    const where = { participants: { some: { userId } } };

    const [conversations, total] = await prisma.$transaction([
      prisma.conversation.findMany({
        where,
        skip,
        take,
        orderBy: [
          { lastMessageAt: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        include: {
          ...participantInclude,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return { conversations, total };
  },

  async countUnreadByConversation(
    conversationIds: string[],
    userId: string
  ): Promise<Record<string, number>> {
    if (conversationIds.length === 0) return {};

    const grouped = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        isRead: false,
      },
      _count: { _all: true },
    });

    const map: Record<string, number> = {};
    for (const g of grouped) {
      map[g.conversationId] = g._count._all;
    }
    return map;
  },

  /**
   * Newest first. Fetches `limit + 1` rows so the caller can compute
   * `nextCursor` (cursor = message id).
   */
  findMessages(params: {
    conversationId: string;
    limit: number;
    cursor?: string | null;
  }) {
    const { conversationId, limit, cursor } = params;

    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  async createMessage(params: {
    conversationId: string;
    senderId: string;
    text: string;
  }) {
    const { conversationId, senderId, text } = params;

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId, senderId, text },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  },

  async markMessagesRead(conversationId: string, userId: string) {
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
    return result.count;
  },

  countUnreadForUser(userId: string) {
    return prisma.message.count({
      where: {
        isRead: false,
        senderId: { not: userId },
        conversation: { participants: { some: { userId } } },
      },
    });
  },
};
