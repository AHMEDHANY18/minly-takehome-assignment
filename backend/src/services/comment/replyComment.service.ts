import { CommentRepository } from "../../repositories/comment.repository";

export async function replyCommentService(
  userId: string,
  text: string,
  parentCommentId: string
) {
  if (!text || text.trim().length === 0) {
    const err: any = new Error("Reply text required");
    err.status = 400;
    throw err;
  }

  const reply = await CommentRepository.createReply({
    userId,
    parentCommentId,
    text,
  });

  return reply;
}
