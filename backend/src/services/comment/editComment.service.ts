// src/services/comment/editComment.service.ts
import { CommentRepository } from "../../repositories/comment.repository";

export async function editCommentService(
  commentId: string,
  userId: string,
  text: string
) {
  const comment = await CommentRepository.findCommentById(commentId);

  if (!comment) {
    const err: any = new Error("Comment not found");
    err.status = 404;
    throw err;
  }

  if (comment.userId !== userId) {
    const err: any = new Error("You cannot edit this comment");
    err.status = 403;
    throw err;
  }

  const updated = await CommentRepository.updateCommentText(
    commentId,
    text.trim()
  );

  return {
    id: updated.id,
    text: updated.text,
    isEdited: updated.isEdited,
    updatedAt: updated.updatedAt,
  };
}
