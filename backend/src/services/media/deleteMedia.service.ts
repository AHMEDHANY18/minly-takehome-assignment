import { MediaRepository } from "../../repositories/media.repository";
import { extractS3Key } from "../../utilities/storage/extractS3Key";
import { deleteFromS3 } from "../../utilities/storage/deleteFromS3";
import { prisma } from "../../config/prisma";

export async function deleteMediaService(mediaId: string, userId: string) {
  // 1. Get basic info
  const media = await MediaRepository.findByIdDetailedForDelete(mediaId);

  if (!media) {
    const error: any = new Error("Media not found");
    error.status = 404;
    throw error;
  }

  if (media.uploaderId !== userId) {
    const error: any = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  // 2. Count likes for that media BEFORE deleting
  const likesCount = await prisma.like.count({
    where: { mediaId: mediaId },
  });

  // 3. Delete from S3
  try {
    const key = extractS3Key(media.url);
    if (key) await deleteFromS3(key);
  } catch (err) {
    console.error("S3 Delete Warning:", err);
  }

  // 4. Delete Likes + Media (transaction)
  await MediaRepository.deleteById(mediaId);

  // 5. Update user stats (decrement media & likes)
  await prisma.user.update({
    where: { id: userId },
    data: {
      mediaCount: { decrement: 1 },
      totalLikesReceived: { decrement: likesCount },  // ← FIXED!
    },
  });

  return { success: true };
}
