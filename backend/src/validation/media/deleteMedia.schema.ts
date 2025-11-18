import { MediaRepository } from "../../repositories/media.repository";
import { extractS3Key } from "../../utilities/storage/extractS3Key";
import { deleteFromS3 } from "../../utilities/storage/deleteFromS3";

export async function deleteMediaService(mediaId: string, userId: string) {
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

  // 1) Delete from S3
  const key = extractS3Key(media.url);
  await deleteFromS3(key);

  // 2) Delete from DB
  await MediaRepository.deleteById(mediaId);

  // 3) Decrement user's mediaCount
  await MediaRepository.decrementUserMediaCount(userId);

  return { success: true };
}
