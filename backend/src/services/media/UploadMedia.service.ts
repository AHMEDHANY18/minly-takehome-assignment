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

  // 2) create media DB record
  const createdMedia = await MediaRepository.createMedia({
    url,
    type: mediaType,
    title,
    description,
    uploaderId: userId,
  });

  // 3) update user's media count
  await MediaRepository.incrementUserMediaCount(userId);

  return createdMedia;
}
