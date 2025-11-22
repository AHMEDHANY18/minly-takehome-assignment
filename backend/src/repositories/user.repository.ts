// src/repositories/user.repository.ts
import { prisma } from "../config/prisma";

export const UserRepository = {
  findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  },

  updateUser(userId: string, data: any) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },

  findByIdWithMedia(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        mediaCount: true,
        totalLikesReceived: true,
        totalLikesGiven: true,
        createdAt: true,
        media: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            type: true,
            title: true,
            description: true,
            likesCount: true,
            createdAt: true,
          },
        },
      },
    });
  },
};
