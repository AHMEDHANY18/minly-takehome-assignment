import { prisma } from "../config/prisma";

export const CommentRepository = {
  async createComment(params: { userId: string; mediaId: string; text: string }) {
    const { userId, mediaId, text } = params;

    return prisma.threadedComment.create({
      data: {
        userId,
        mediaId,
        text,
        parentCommentId: null, // main comment
      },
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
};
