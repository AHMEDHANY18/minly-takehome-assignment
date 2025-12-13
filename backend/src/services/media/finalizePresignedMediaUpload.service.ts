import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, s3Config } from "../../config/s3";
import { MediaRepository } from "../../repositories/media.repository";
import { getPublicUrl } from "../../utilities/storage/getPublicUrl";

export async function finalizePresignedMediaUploadService(params: {
  userId: string;
  key: string;
  title?: string;
  description?: string;
  type: "IMAGE" | "VIDEO";
}) {
  const { userId, key, title, description, type } = params;

  if (!key) throw new Error("MISSING_KEY");

  // ✅ Security: تأكد إن ال key بتاع المستخدم نفسه (منع إن حد يسجّل key بتاع حد تاني)
  const safeUserId = userId.replace(/[^a-zA-Z0-9-_]/g, "");
  const expectedPrefix = `media/${safeUserId}/`;
  if (!key.startsWith(expectedPrefix)) {
    throw new Error("FORBIDDEN_KEY");
  }

  // ✅ Optional but recommended: تأكد إن object موجود على S3 قبل ما تسجّل في DB
  if (!s3Client) throw new Error("S3 is not configured");

  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
      })
    );
  } catch {
    throw new Error("OBJECT_NOT_FOUND");
  }

  const url = getPublicUrl(key);

  const created = await MediaRepository.createMediaWithCounter({
    url,
    type,
    title,
    description,
    uploaderId: userId,
  });

  return created;
}
