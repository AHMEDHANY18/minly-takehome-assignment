// src/utilities/storage/getPublicUrl.ts
const { AWS_S3_BUCKET, AWS_REGION, AWS_S3_BASE_URL } = process.env;

/**
 * يبني URL كامل من الـ key
 * لو AWS_S3_BASE_URL متعرفة في الـ env هنستخدمها
 * غير كده هنستخدم فورم S3 الافتراضي
 */
export function getPublicUrl(key: string): string {
  if (!key) {
    throw new Error("S3 object key is required to build public URL");
  }

  // لو عندك CDN أو domain مخصص
  if (AWS_S3_BASE_URL) {
    return `${AWS_S3_BASE_URL.replace(/\/$/, "")}/${key}`;
  }

  if (!AWS_S3_BUCKET || !AWS_REGION) {
    throw new Error("AWS_S3_BUCKET and AWS_REGION must be set to build S3 URL");
  }

  // الفورم الافتراضي بتاع S3
  return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}
