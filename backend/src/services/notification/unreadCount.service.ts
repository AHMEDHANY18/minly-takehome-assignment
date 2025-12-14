import { NotificationRepository } from "../../repositories/notification.repository";

export async function unreadCountService(params: { userId: string }) {
  const count = await NotificationRepository.unreadCount(params.userId);
  return { count };
}
