import { buildMediaKey } from "../../utilities/storage/buildMediaKey";
import { getPublicUrl } from "../../utilities/storage/getPublicUrl";
import { mimeToExt, assertAllowedContentType } from "../../utilities/storage/mimeToExt";
import { createPresignedPutUrl } from "../../utilities/storage/presignPut";

export async function createPresignedMediaUploadService(params: {
  userId: string;
  contentType: string;
  type?: "IMAGE" | "VIDEO";
}) {
  const { userId, contentType, type } = params;

  if (!contentType) throw new Error("MISSING_CONTENT_TYPE");

  assertAllowedContentType(contentType);

  // Validate type vs contentType (اختياري لكن أفضل)
  if (type === "IMAGE" && !contentType.startsWith("image/")) throw new Error("TYPE_MISMATCH");
  if (type === "VIDEO" && !contentType.startsWith("video/")) throw new Error("TYPE_MISMATCH");

  const extension = mimeToExt(contentType);

  const key = buildMediaKey({
    userId,
    kind: "media",
    extension,
  });

  const { uploadUrl } = await createPresignedPutUrl({
    key,
    contentType,
    expiresInSeconds: 300,
  });

  const publicUrl = getPublicUrl(key);

  return { key, uploadUrl, publicUrl };
}
