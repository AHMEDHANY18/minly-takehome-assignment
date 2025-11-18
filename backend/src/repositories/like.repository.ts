import { prisma } from "../config/prisma";
import { Prisma } from "@prisma/client";

export const LikeRepository = {
  async findByUserAndMedia(userId: string, mediaId: string) {
    return prisma.like.findUnique({
      where: {
        userId_mediaId: { userId, mediaId },
      },
    });
  },

  async createLikeWithCounters(params: {
    userId: string;
    mediaId: string;
    mediaOwnerId: string;
  }) {
    const { userId, mediaId, mediaOwnerId } = params;

    try {
      const [like, updatedMedia] = await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            mediaId,
          },
        }),
        prisma.media.update({
          where: { id: mediaId },
          data: {
            likesCount: { increment: 1 },
          },
        }),
        prisma.user.update({
          where: { id: mediaOwnerId },
          data: {
            totalLikesReceived: { increment: 1 },
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            totalLikesGiven: { increment: 1 },
          },
        }),
      ]);

      return { like, updatedLikesCount: updatedMedia.likesCount };
    } catch (err: any) {
      // unique constraint @@unique([userId, mediaId])
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const error: any = new Error("Already liked");
        error.status = 409;
        throw error;
      }

      throw err;
    }
  },

  async deleteLikeWithCounters(params: {
    likeId: string;
    userId: string;
    mediaId: string;
    mediaOwnerId: string;
  }) {
    const { likeId, userId, mediaId, mediaOwnerId } = params;

    const [_, updatedMedia] = await prisma.$transaction([
      prisma.like.delete({
        where: { id: likeId },
      }),
      prisma.media.update({
        where: { id: mediaId },
        data: {
          likesCount: { decrement: 1 },
        },
      }),
      prisma.user.update({
        where: { id: mediaOwnerId },
        data: {
          totalLikesReceived: { decrement: 1 },
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          totalLikesGiven: { decrement: 1 },
        },
      }),
    ]);

    return { updatedLikesCount: updatedMedia.likesCount };
  },
};
