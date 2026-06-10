import { deleteCommentService } from "../comment/deleteComment.service";
import { AdminRepository } from "../../repositories/admin.repository";

export async function adminDeleteCommentService(
  commentId: string,
  adminId: string
) {
  const result = await deleteCommentService(commentId, adminId, {
    asAdmin: true,
  });

  // related PENDING reports are considered handled
  await AdminRepository.markPendingReportsReviewed("COMMENT", commentId);

  return { id: commentId, deleted: true, deletedComments: result.deletedComments };
}
