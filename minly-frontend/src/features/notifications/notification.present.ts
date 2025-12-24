import type { NotificationItem } from "@/features/notifications/store/notification.store";

export function presentNotification(n: NotificationItem) {
  const actorName = n.actor?.name ?? "Someone";
  const actorId = n.actor?.id ?? null;
  const mediaId = n.media?.id ?? null;
  const commentText = n.comment?.text?.trim() ?? null;

  const postHref = mediaId ? `/media/${mediaId}` : "/notifications";
  const profileHref = actorId ? `/profile/${actorId}` : "/notifications";

  switch (n.type) {
    case "LIKE":
      return {
        primaryText: `${actorName} liked your post`,
        secondaryText: null as string | null,
        href: postHref,
        rightThumb: n.media?.thumbnailUrl ?? null,
      };
    case "COMMENT":
      return {
        primaryText: `${actorName} commented on your post`,
        secondaryText: commentText ? `"${truncate(commentText, 80)}"` : null,
        href: postHref,
        rightThumb: n.media?.thumbnailUrl ?? null,
      };
    case "FOLLOW":
      return {
        primaryText: `${actorName} started following you`,
        secondaryText: null,
        href: profileHref,
        rightThumb: null,
      };
    case "SYSTEM":
    default:
      return {
        primaryText: "System notification",
        secondaryText: commentText ? truncate(commentText, 120) : null,
        href: "/notifications",
        rightThumb: null,
      };
  }
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}
