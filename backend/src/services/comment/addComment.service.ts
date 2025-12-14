import { prisma } from "../../config/prisma";
import { CommentRepository } from "../../repositories/comment.repository";
import { MediaRepository } from "../../repositories/media.repository";
import { NotificationRepository } from "../../repositories/notification.repository";

export async function createCommentService(
  mediaId: string,
  userId: string,
  text: string
) {
  if (!text || text.trim().length === 0) {
    const err: any = new Error("Comment text required");
    err.status = 400;
    throw err;
  }

  const media = await MediaRepository.findById(mediaId);
  if (!media) {
    const err: any = new Error("Media not found");
    err.status = 404;
    throw err;
  }

  // 1) Create comment
  const comment = await CommentRepository.createComment({
    userId,
    mediaId,
    text,
  });

  // 2) Increment Media.commentCount
  await prisma.media.update({
    where: { id: mediaId },
    data: {
      commentCount: { increment: 1 },
    },
  });

  // 🔔 3) Create + Emit Notification (REAL-TIME)
  if (media.uploaderId !== userId) {
    await NotificationRepository.create({
      type: "COMMENT",
      actorId: userId,
      targetUserId: media.uploaderId,
      mediaId: mediaId,
      commentId: comment.id,
    });
  }

  return {
    id: comment.id,
    text: comment.text,
    userId: comment.userId,
    createdAt: comment.createdAt,
  };
}
