// src/utilities/storage/uploadToS3.ts
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, s3Config } from "../../config/s3";
import logger from "../../config/logger";

export interface UploadToS3Params {
  key: string;
  body: Buffer;
  contentType: string;
}

/**
 * يرفع ملف إلى S3 باستخدام key جاهز
 */
export async function uploadToS3(params: UploadToS3Params): Promise<{ key: string }> {
  const { key, body, contentType } = params;

  if (!s3Client) {
    throw new Error("S3 is not configured");
  }

  try {
    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // لو الباكت عندك مش public-by-default ممكن تضيف:
      // ACL: "public-read",
    });

    await s3Client.send(command);

    return { key };
  } catch (error) {
    logger.error("Failed to upload file to S3", error);
    throw new Error("Failed to upload file to storage");
  }
}

import { buildMediaKey } from "./buildMediaKey";
import { getPublicUrl } from "./getPublicUrl";

type MediaKind = "media" | "avatar";

interface UploadMediaBufferParams {
  userId: string;
  kind: MediaKind;           // "media" عادي أو "avatar"
  file: Express.Multer.File; // جاي من multer
}

/**
 * Helper أعلى: يبني key + يرفع الملف + يرجّع key + url
 */
export async function uploadMediaBuffer(
  params: UploadMediaBufferParams
): Promise<{ key: string; url: string }> {
  const { userId, kind, file } = params;

  if (!file || !file.buffer) {
    throw new Error("File buffer is required");
  }

  const extension = getExtensionFromMimeType(file.mimetype);

  const key = buildMediaKey({
    userId,
    kind,
    extension,
  });

  // الرفع الفعلي
  await uploadToS3({
    key,
    body: file.buffer,
    contentType: file.mimetype,
  });

  const url = getPublicUrl(key);

  return { key, url };
}

/**
 * تحويل mimetype إلى extension بسيط
 */
function getExtensionFromMimeType(mimetype: string): string {
  switch (mimetype) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "video/mp4":
      return "mp4";
    default:
      // fallback بسيط، المفروض قبل كده أصلاً multer يكون مانع أنواع مش مدعومة
      return "bin";
  }
}
