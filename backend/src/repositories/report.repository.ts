// src/repositories/report.repository.ts
import { prisma } from "../config/prisma";

export type ReportTargetTypeConst = "MEDIA" | "COMMENT" | "USER";
export type ReportReasonConst = "SPAM" | "ABUSE" | "INAPPROPRIATE" | "OTHER";

export const ReportRepository = {
  findExisting(
    reporterId: string,
    targetType: ReportTargetTypeConst,
    targetId: string
  ) {
    return prisma.report.findFirst({
      where: { reporterId, targetType, targetId },
    });
  },

  create(data: {
    reporterId: string;
    targetType: ReportTargetTypeConst;
    targetId: string;
    reason: ReportReasonConst;
    details?: string | null;
  }) {
    return prisma.report.create({
      data: {
        reporterId: data.reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        details: data.details ?? null,
      },
    });
  },

  listForReporter(reporterId: string) {
    return prisma.report.findMany({
      where: { reporterId },
      orderBy: { createdAt: "desc" },
    });
  },

  async targetExists(
    targetType: ReportTargetTypeConst,
    targetId: string
  ): Promise<boolean> {
    if (targetType === "MEDIA") {
      const media = await prisma.media.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      return !!media;
    }

    if (targetType === "COMMENT") {
      const comment = await prisma.threadedComment.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      return !!comment;
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    return !!user;
  },
};
