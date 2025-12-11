import { prisma } from "../../config/prisma";
import { CommentRepository } from "../../repositories/comment.repository";

export async function deleteCommentService(
  commentId: string,
  userId: string
) {
  const comment = await CommentRepository.findCommentById(commentId);

  if (!comment) {
    const err: any = new Error("Comment not found");
    err.status = 404;
    throw err;
  }
  if (comment.userId !== userId) {
    const err: any = new Error("You cannot delete this comment");
    err.status = 403;
    throw err;
  }
  const isMainComment = comment.parentCommentId === null;
  let deletedCount = 1;
  if (isMainComment) {
    const replies = await CommentRepository.deleteReplies(comment.id);
    deletedCount += replies.count;
  }
  await CommentRepository.deleteComment(commentId);
  await prisma.media.update({
    where: { id: comment.mediaId },
    data: {
      commentCount: { decrement: deletedCount },
    },
  });

  return {
    message: "Comment deleted",
    deletedComments: deletedCount,
  };
}
