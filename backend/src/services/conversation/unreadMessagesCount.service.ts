// src/services/conversation/unreadMessagesCount.service.ts
import { ConversationRepository } from "../../repositories/conversation.repository";

export async function unreadMessagesCountService(viewerId: string) {
  const count = await ConversationRepository.countUnreadForUser(viewerId);
  return { count };
}
