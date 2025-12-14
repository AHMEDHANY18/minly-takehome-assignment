import { NotificationRepository } from "../../repositories/notification.repository";

export async function markNotificationReadService(params: {
  userId: string;
  notificationId: string;
}) {
  const updated = await NotificationRepository.markRead(
    params.userId,
    params.notificationId
  );

  if (!updated) {
    const err: any = new Error("Notification not found");
    err.status = 404;
    throw err;
  }

  return { updated: true };
}
