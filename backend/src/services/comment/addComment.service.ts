import { prisma } from "../../config/prisma";
import { CommentRepository } from "../../repositories/comment.repository";
import { MediaRepository } from "../../repositories/media.repository";


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

  const comment = await CommentRepository.createComment({
    userId,
    mediaId,
    text,
  });

  // 3) Increment Media.commentCount
  await prisma.media.update({
    where: { id: mediaId },
    data: {
      commentCount: { increment: 1 },
    },
  });

  return {
    id: comment.id,
    text: comment.text,
    userId: comment.userId,
    createdAt: comment.createdAt,
  };
}
