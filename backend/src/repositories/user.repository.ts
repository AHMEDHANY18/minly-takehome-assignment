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

  // 🆕 عشان البروفايل
  findByIdWithMedia(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        media: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },
};
