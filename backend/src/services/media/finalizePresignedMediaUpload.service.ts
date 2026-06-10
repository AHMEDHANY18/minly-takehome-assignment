import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, s3Config } from "../../config/s3";
import { getPublicUrl } from "../../utilities/storage/getPublicUrl";
import { MediaRepository } from "../../repositories/media.repository";
import { UserRepository } from "../../repositories/user.repository";
import { extractS3Key } from "../../utilities/storage/extractS3Key";
import { deleteFromS3 } from "../../utilities/storage/deleteFromS3";
import { extractHashtags } from "../../utilities/extractHashtags";
import { HashtagRepository } from "../../repositories/hashtag.repository";

export async function finalizePresignedUploadService(params: {
  userId: string;
  kind: "media" | "avatar";
  key: string;

  // media only
  title?: string;
  description?: string;
  type?: "IMAGE" | "VIDEO";
  thumbnailUrl?: string;
}): Promise<{ kind: "media" | "avatar"; data: any }> {
  const { userId, kind, key, title, description, type, thumbnailUrl } = params;

  if (!kind) throw new Error("MISSING_KIND");
  if (kind !== "media" && kind !== "avatar") throw new Error("INVALID_KIND");

  if (!key) throw new Error("MISSING_KEY");

  const safeUserId = userId.replace(/[^a-zA-Z0-9-_]/g, "");
  const expectedPrefix =
  kind === "media"
    ? `media/${safeUserId}/`
    : `avatars/${safeUserId}/`;

if (!key.startsWith(expectedPrefix)) {
  throw new Error("FORBIDDEN_KEY");
}
  if (!s3Client) throw new Error("S3 is not configured");

  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: s3Config.bucket, Key: key }));
  } catch {
    throw new Error("OBJECT_NOT_FOUND");
  }

  const url = getPublicUrl(key);

  if (kind === "media") {
    if (!type) throw new Error("MISSING_MEDIA_TYPE");
    if (!["IMAGE", "VIDEO"].includes(type)) throw new Error("MISSING_MEDIA_TYPE");

    const created = await MediaRepository.createMediaWithCounter({
      url,
      type,
      title,
      description,
      thumbnailUrl,
      uploaderId: userId,
    });

    // sync #hashtags from title + description (best-effort)
    try {
      const tags = extractHashtags(`${title ?? ""} ${description ?? ""}`);
      await HashtagRepository.syncMediaHashtags(created.id, tags);
    } catch {
      // ignore — hashtags are not critical
    }

    return { kind: "media", data: created };
  }
  const user = await UserRepository.findById(userId);
  if (!user) {
    const e: any = new Error("User not found");
    e.status = 404;
    throw e;
  }

  const oldUrl = user.avatarUrl;
  const updatedUser = await UserRepository.updateUser(userId, { avatarUrl: url });
  if (oldUrl && oldUrl !== url) {
    try {
      const oldKey = extractS3Key(oldUrl);
      if (oldKey) await deleteFromS3(oldKey);
    } catch {
      // ignore
    }
  }

  return { kind: "avatar", data: updatedUser };
}
