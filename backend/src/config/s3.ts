// src/config/s3.ts
import { S3Client } from "@aws-sdk/client-s3";
import logger from "./logger";

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET } =
  process.env;

const hasRequiredEnv =
  !!AWS_ACCESS_KEY_ID && !!AWS_SECRET_ACCESS_KEY && !!AWS_REGION && !!AWS_S3_BUCKET;

if (!hasRequiredEnv) {
  logger.warn(
    "Missing AWS S3 environment variables; S3 operations will fail until configured"
  );
}

export const s3Client = hasRequiredEnv
  ? new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID as string,
        secretAccessKey: AWS_SECRET_ACCESS_KEY as string,
      },
    })
  : null;

export const s3Config = {
  bucket: AWS_S3_BUCKET || "",
  region: AWS_REGION || "",
};
