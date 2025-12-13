import { prisma } from "../../config/prisma";
import { BookmarkRepository } from "../../repositories/bookmark.repository";

interface ToggleBookmarkInput {
  userId: string;
  mediaId: string;
}

export async function toggleBookmarkService({
  userId,
  mediaId,
}: ToggleBookmarkInput) {
  // 1) تأكد إن الميديا موجودة
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { id: true },
  });

  if (!media) {
    throw new Error("MEDIA_NOT_FOUND");
  }

  // 2) toggle bookmark
  const result = await BookmarkRepository.toggle(userId, mediaId);

  return result; // { bookmarked: boolean }
}
