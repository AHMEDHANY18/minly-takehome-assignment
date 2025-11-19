// src/services/media/deleteMedia.service.ts (or similar)

import { MediaRepository } from "../../repositories/media.repository";
import { extractS3Key } from "../../utilities/storage/extractS3Key";
import { deleteFromS3 } from "../../utilities/storage/deleteFromS3";

export async function deleteMediaService(mediaId: string, userId: string) {
  // 1. Get basic info to check ownership and get S3 URL
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

  // 2. Delete from S3 (Cloud storage)
  try {
    const key = extractS3Key(media.url);
    if (key) await deleteFromS3(key);
  } catch (err) {
    console.error("S3 Delete Warning:", err);
    // We usually continue even if S3 fails, to ensure DB consistency
  }

  // 3. Delete from DB (This now calls the Fixed Transaction)
  await MediaRepository.deleteById(mediaId);

  // 4. Decrement user stats
  await MediaRepository.decrementUserMediaCount(userId);

  return { success: true };
}