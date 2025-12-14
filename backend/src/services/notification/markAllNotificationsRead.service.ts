import { NotificationRepository } from "../../repositories/notification.repository";

export async function markAllNotificationsReadService(params: { userId: string }) {
  const count = await NotificationRepository.markAllRead(params.userId);
  return { updatedCount: count };
}
