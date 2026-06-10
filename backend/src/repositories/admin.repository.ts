// src/repositories/admin.repository.ts
import { prisma } from "../config/prisma";
import { ReportTargetTypeConst } from "./report.repository";

export type ReportStatusConst = "PENDING" | "REVIEWED" | "DISMISSED";

export const AdminRepository = {
  async getStats() {
    const now = new Date();

    const [
      users,
      media,
      comments,
      likes,
      reportsTotal,
      reportsPending,
      conversations,
      activeStories,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.media.count(),
      prisma.threadedComment.count(),
      prisma.like.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.conversation.count(),
      prisma.story.count({ where: { expiresAt: { gt: now } } }),
    ]);

    return {
      users,
      media,
      comments,
      likes,
      reports: { total: reportsTotal, pending: reportsPending },
      conversations,
      activeStories,
    };
  },

  listReportsWithCount(params: {
    status?: ReportStatusConst;
    skip: number;
    take: number;
  }) {
    const { status, skip, take } = params;
    const where = status ? { status } : {};

    return prisma.$transaction([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);
  },

  findReportById(id: string) {
    return prisma.report.findUnique({ where: { id } });
  },

  updateReportStatus(id: string, status: ReportStatusConst) {
    return prisma.report.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  },

  // when an admin force-deletes content, its PENDING reports become REVIEWED
  markPendingReportsReviewed(
    targetType: ReportTargetTypeConst,
    targetId: string
  ) {
    return prisma.report.updateMany({
      where: { targetType, targetId, status: "PENDING" },
      data: { status: "REVIEWED" },
    });
  },

  // -------------------------
  // Report target previews
  // -------------------------
  getMediaPreview(id: string) {
    return prisma.media.findUnique({
      where: { id },
      select: {
        id: true,
        url: true,
        thumbnailUrl: true,
        type: true,
        title: true,
        uploader: { select: { id: true, name: true } },
      },
    });
  },

  getCommentPreview(id: string) {
    return prisma.threadedComment.findUnique({
      where: { id },
      select: {
        id: true,
        text: true,
        user: { select: { id: true, name: true } },
      },
    });
  },

  getUserPreview(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
  },
};
