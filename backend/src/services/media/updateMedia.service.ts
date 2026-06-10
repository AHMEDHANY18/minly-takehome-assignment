import { MediaRepository } from "../../repositories/media.repository";
import { HashtagRepository } from "../../repositories/hashtag.repository";
import { extractHashtags } from "../../utilities/extractHashtags";

export async function updateMediaService(
  mediaId: string,
  userId: string,
  data: { title?: string; description?: string }
) {
  const media = await MediaRepository.findByIdWithUploader(mediaId);

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

  const updatedMedia = await MediaRepository.updateMedia(mediaId, {
    title: data.title,
    description: data.description,
  });

  // re-sync #hashtags from the updated title + description (best-effort)
  try {
    const tags = extractHashtags(
      `${updatedMedia.title ?? ""} ${updatedMedia.description ?? ""}`
    );
    await HashtagRepository.syncMediaHashtags(mediaId, tags);
  } catch {
    // ignore — hashtags are not critical
  }

  return updatedMedia;
}
