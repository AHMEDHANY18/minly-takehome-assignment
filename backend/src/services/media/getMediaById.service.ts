import { MediaRepository } from "../../repositories/media.repository";

export async function getMediaByIdService(mediaId: string) {
  const media = await MediaRepository.findByIdDetailed(mediaId);

  if (!media) {
    const error: any = new Error("Media not found");
    error.status = 404;
    throw error;
  }

  return media;
}
