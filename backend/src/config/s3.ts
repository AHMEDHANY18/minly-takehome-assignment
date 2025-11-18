// src/config/s3.ts
import { S3Client } from "@aws-sdk/client-s3";
import logger from "./logger";

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET } =
  process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_S3_BUCKET) {
  logger.error("Missing AWS S3 environment variables");
  throw new Error("AWS S3 environment variables are not set");
}

// ✅ S3 client جاهز تستخدمه في أي مكان في المشروع
export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ config بسيط نرجع نستخدمه في الخدمات
export const s3Config = {
  bucket: AWS_S3_BUCKET,
  region: AWS_REGION,
};
