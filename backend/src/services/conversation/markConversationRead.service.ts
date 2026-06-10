// src/services/conversation/markConversationRead.service.ts
import { ConversationRepository } from "../../repositories/conversation.repository";

export async function markConversationReadService(
  viewerId: string,
  conversationId: string
) {
  const conversation = await ConversationRepository.findByIdWithParticipants(
    conversationId
  );

  if (!conversation) {
    const err: any = new Error("Conversation not found");
    err.status = 404;
    throw err;
  }

  const isParticipant = conversation.participants.some(
    (p) => p.userId === viewerId
  );
  if (!isParticipant) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  const readCount = await ConversationRepository.markMessagesRead(
    conversationId,
    viewerId
  );

  return { conversationId, readCount };
}
