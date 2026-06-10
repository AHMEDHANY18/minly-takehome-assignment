import { CommentRepository } from "../../repositories/comment.repository";
import { notifyMentionedUsers } from "./mention.service";

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

  // 🔔 @mentions → SYSTEM notifications (best-effort)
  await notifyMentionedUsers({
    actorId: userId,
    mediaId: reply.mediaId,
    commentId: reply.id,
    text,
  });

  return reply;
}
