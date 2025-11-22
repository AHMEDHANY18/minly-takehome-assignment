import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, s3Config } from "../../config/s3";

export async function deleteFromS3(key: string) {
  if (!s3Client) {
    throw new Error("S3 is not configured");
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    })
  );
}
