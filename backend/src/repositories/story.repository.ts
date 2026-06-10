// src/repositories/story.repository.ts
import { prisma } from "../config/prisma";

export const StoryRepository = {
  create(data: {
    userId: string;
    url: string;
    type: "IMAGE" | "VIDEO";
    expiresAt: Date;
  }) {
    return prisma.story.create({ data });
  },

  // active stories for a set of users, with the viewer's own StoryView rows
  findActiveForUsers(userIds: string[], viewerId: string) {
    return prisma.story.findMany({
      where: {
        userId: { in: userIds },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        url: true,
        type: true,
        createdAt: true,
        expiresAt: true,
        userId: true,
        user: { select: { id: true, name: true, avatarUrl: true } },
        views: {
          where: { viewerId },
          select: { id: true },
        },
      },
    });
  },

  findById(id: string) {
    return prisma.story.findUnique({
      where: { id },
      select: { id: true, userId: true, expiresAt: true },
    });
  },

  upsertView(storyId: string, viewerId: string) {
    return prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId, viewerId } },
      create: { storyId, viewerId },
      update: {},
    });
  },

  listViewers(storyId: string) {
    return prisma.storyView.findMany({
      where: { storyId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        viewer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  },

  deleteById(id: string) {
    return prisma.$transaction([
      prisma.storyView.deleteMany({ where: { storyId: id } }),
      prisma.story.delete({ where: { id } }),
    ]);
  },
};
