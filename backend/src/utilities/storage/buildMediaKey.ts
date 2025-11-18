// src/utilities/storage/buildMediaKey.ts
import { randomUUID } from "crypto";

type MediaKeyKind = "media" | "avatar";

interface BuildMediaKeyOptions {
  userId: string;
  kind: MediaKeyKind;     // "media" or "avatar"
  extension: string;      // e.g. "jpg", "png", "mp4"
  mediaId?: string;       // optional, لو عايز تربط بميديا معينة
}

/**
 * يبني S3 object key منظم
 * مثال:
 *  - media/user-123/8d8a...-file.jpg
 *  - avatars/user-123/3fa8...-avatar.png
 */
export function buildMediaKey(options: BuildMediaKeyOptions): string {
  const { userId, kind, extension, mediaId } = options;

  const cleanUserId = userId.replace(/[^a-zA-Z0-9-_]/g, "");
  const idPart = mediaId ? mediaId.replace(/[^a-zA-Z0-9-_]/g, "") : "";
  const uuid = randomUUID();

  const baseFolder = kind === "avatar" ? "avatars" : "media";

  const parts = [baseFolder, cleanUserId];
  if (idPart) parts.push(idPart);
  parts.push(`${uuid}.${extension}`);

  return parts.join("/");
}
