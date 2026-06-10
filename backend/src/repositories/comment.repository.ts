import { prisma } from "../config/prisma";

export const CommentRepository = {
  async createComment(params: { userId: string; mediaId: string; text: string }) {
    const { userId, mediaId, text } = params;

    return prisma.threadedComment.create({
      data: {
        userId,
        mediaId,
        text,
        parentCommentId: null,
      },
    });
  },
  async findCommentById(commentId: string) {
    return prisma.threadedComment.findUnique({
      where: { id: commentId },
    });
  },

  async deleteComment(commentId: string) {
    return prisma.threadedComment.delete({
      where: { id: commentId },
    });
  },

  async updateCommentText(commentId: string, text: string) {
    return prisma.threadedComment.update({
      where: { id: commentId },
      data: { text, isEdited: true },
    });
  },

  // احذف كل replies المرتبطة بـ Comment رئيسي
  async deleteReplies(parentCommentId: string) {
    return prisma.threadedComment.deleteMany({
      where: { parentCommentId },
    });
  },
  async createReply(params: { userId: string; parentCommentId: string; text: string }) {
    const { userId, parentCommentId, text } = params;

    const parent = await prisma.threadedComment.findUnique({
      where: { id: parentCommentId },
    });

    if (!parent) {
      throw new Error("Parent comment not found");
    }

    return prisma.threadedComment.create({
      data: {
        userId,
        mediaId: parent.mediaId,
        text,
        parentCommentId,
      },
    });
  },

  async findReplies(params: {
    commentId: string;
    viewerId: string;
    limit: number;
    cursor: string | null; // createdAt ISO
  }) {
    const { commentId, viewerId, limit, cursor } = params;

    return prisma.threadedComment.findMany({
      where: {
        parentCommentId: commentId,
        ...(cursor
          ? { createdAt: { lt: new Date(cursor) } } // pagination
          : {}),
      },
      orderBy: { createdAt: "desc" }, // newest replies first (زي الانستجرام غالبًا)
      take: limit,
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  },
};
