import { prisma } from "../config/prisma";

export const MediaRepository = {
  async createMedia(data: {
    url: string;
    type: "IMAGE" | "VIDEO";
    title?: string;
    description?: string;
    uploaderId: string;
  }) {
    return prisma.media.create({ data });
  },

  async incrementUserMediaCount(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { mediaCount: { increment: 1 } },
    });
  },

  async getMediaById(mediaId: string) {
    return prisma.media.findUnique({
      where: { id: mediaId },
    });
  },

  async deleteMedia(mediaId: string) {
    return prisma.media.delete({
      where: { id: mediaId },
    });
  },

  async getUserMedia(userId: string) {
    return prisma.media.findMany({
      where: { uploaderId: userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getFeed(limit: number, skip: number) {
    return prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });
  },



  async findManyForFeed(skip: number, take: number) {
    return prisma.media.findMany({
      skip,
      take,
      orderBy: { likesCount: "desc" },
      include: {
        uploader: true,
      },
    });
  },

  // 👇 Pagination helpers
  async countAll() {
    return prisma.media.count();
  },

  async findById(id: string) {
    return prisma.media.findUnique({
      where: { id },
      include: { uploader: true },
    });
  },

  async deleteById(id: string) {
    return prisma.media.delete({
      where: { id },
    });
  },
  async findByIdDetailed(id: string) {
    return prisma.media.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  },
};


