// src/services/conversation/getMessages.service.ts
import { ConversationRepository } from "../../repositories/conversation.repository";

interface GetMessagesParams {
  viewerId: string;
  conversationId: string;
  limit: number;
  cursor?: string | null;
}

export async function getMessagesService({
  viewerId,
  conversationId,
  limit,
  cursor,
}: GetMessagesParams) {
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

  const rows = await ConversationRepository.findMessages({
    conversationId,
    limit,
    cursor,
  });

  const hasMore = rows.length > limit;
  const messages = hasMore ? rows.slice(0, limit) : rows;

  return {
    messages,
    nextCursor: hasMore ? messages[messages.length - 1].id : null,
  };
}
