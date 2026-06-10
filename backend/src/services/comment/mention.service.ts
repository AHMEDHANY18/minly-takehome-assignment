// src/services/comment/mention.service.ts
import { extractMentions } from "../../utilities/extractMentions";
import { UserRepository } from "../../repositories/user.repository";
import { NotificationRepository } from "../../repositories/notification.repository";

/**
 * Best-effort: matches @Name tokens (case-insensitive exact name match)
 * and sends a SYSTEM notification to every non-self match.
 * Never throws — names are not unique and mentions are not critical.
 */
export async function notifyMentionedUsers(params: {
  actorId: string;
  mediaId: string;
  commentId: string;
  text: string;
}) {
  const { actorId, mediaId, commentId, text } = params;

  try {
    const names = extractMentions(text);
    if (names.length === 0) return;

    const users = await UserRepository.findManyByNamesInsensitive(names);

    const seen = new Set<string>();
    for (const user of users) {
      if (user.id === actorId || seen.has(user.id)) continue;
      seen.add(user.id);

      await NotificationRepository.create({
        type: "SYSTEM",
        actorId,
        targetUserId: user.id,
        mediaId,
        commentId,
      });
    }
  } catch {
    // best-effort only
  }
}
