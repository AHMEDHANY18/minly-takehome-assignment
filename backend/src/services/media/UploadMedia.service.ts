import { MediaRepository } from "../../repositories/media.repository";
import { uploadMediaBuffer } from "../../utilities/storage/uploadToS3";

interface UploadMediaParams {
  userId: string;
  file: Express.Multer.File;
  title?: string;
  description?: string;
  type?: "IMAGE" | "VIDEO";
}

export async function uploadMediaService(params: UploadMediaParams) {
  const { userId, file, title, description, type } = params;

  const mediaType = type || (file.mimetype.startsWith("video") ? "VIDEO" : "IMAGE");

  // 1) upload to S3
  const { url } = await uploadMediaBuffer({
    userId,
    kind: "media",
    file,
  });

  // 2) create media DB record + increment user count atomically
  const createdMedia = await MediaRepository.createMediaWithCounter({
    url,
    type: mediaType,
    title,
    description,
    uploaderId: userId,
  });

  return createdMedia;
}
