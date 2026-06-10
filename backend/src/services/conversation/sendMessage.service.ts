// src/services/conversation/sendMessage.service.ts
import { ConversationRepository } from "../../repositories/conversation.repository";
import { BlockRepository } from "../../repositories/block.repository";
import { NotificationStream } from "../../realtime/notification.stream";

export async function sendMessageService(params: {
  viewerId: string;
  conversationId: string;
  text: string;
}) {
  const { viewerId, conversationId, text } = params;

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

  const other = conversation.participants.find((p) => p.userId !== viewerId);

  if (other) {
    const blocked = await BlockRepository.isBlockedEitherWay(
      viewerId,
      other.userId
    );
    if (blocked) {
      const err: any = new Error("User is blocked");
      err.status = 403;
      throw err;
    }
  }

  const message = await ConversationRepository.createMessage({
    conversationId,
    senderId: viewerId,
    text: text.trim(),
  });

  // 🔔 realtime push to the other participant (SSE)
  if (other) {
    NotificationStream.emit(other.userId, {
      kind: "MESSAGE",
      conversationId,
      message,
    });
  }

  return message;
}
