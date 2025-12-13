import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, s3Config } from "../../config/s3";

export async function createPresignedPutUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  const { key, contentType, expiresInSeconds = 300 } = params;

  if (!s3Client) throw new Error("S3 is not configured");

  const cmd = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, cmd, { expiresIn: expiresInSeconds });
  return { uploadUrl };
}
