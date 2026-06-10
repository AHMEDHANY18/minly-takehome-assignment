// src/services/conversation/listConversations.service.ts
import { ConversationRepository } from "../../repositories/conversation.repository";

interface ListConversationsParams {
  viewerId: string;
  page: number;
  limit: number;
}

export async function listConversationsService({
  viewerId,
  page,
  limit,
}: ListConversationsParams) {
  const skip = (page - 1) * limit;

  const { conversations, total } = await ConversationRepository.listForUser({
    userId: viewerId,
    skip,
    take: limit,
  });

  const unreadMap = await ConversationRepository.countUnreadByConversation(
    conversations.map((c) => c.id),
    viewerId
  );

  const mapped = conversations.map((conversation) => {
    const other = conversation.participants.find(
      (p) => p.userId !== viewerId
    );
    const lastMessage = conversation.messages[0] ?? null;

    return {
      id: conversation.id,
      participant: other
        ? {
            id: other.user.id,
            name: other.user.name,
            avatarUrl: other.user.avatarUrl,
          }
        : null,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            text: lastMessage.text,
            mediaUrl: lastMessage.mediaUrl,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          }
        : null,
      unreadCount: unreadMap[conversation.id] ?? 0,
      lastMessageAt: conversation.lastMessageAt,
    };
  });

  return {
    conversations: mapped,
    page,
    limit,
    total,
    hasMore: skip + mapped.length < total,
  };
}
