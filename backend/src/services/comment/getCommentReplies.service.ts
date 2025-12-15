import { CommentRepository } from "../../repositories/comment.repository";

interface Params {
  commentId: string;
  viewerId: string;
  limit: number;
  cursor: string | null; 
}

export async function getCommentRepliesService({
  commentId,
  viewerId,
  limit,
  cursor,
}: Params) {
  const items = await CommentRepository.findReplies({
    commentId,
    viewerId,
    limit,
    cursor,
  });

  // nextCursor = createdAt لآخر عنصر (لو رجع limit كاملة)
  const nextCursor =
    items.length === limit ? items[items.length - 1].createdAt : null;

  return {
    items,
    meta: {
      nextCursor,
      hasMore: Boolean(nextCursor),
      limit,
    },
  };
}
