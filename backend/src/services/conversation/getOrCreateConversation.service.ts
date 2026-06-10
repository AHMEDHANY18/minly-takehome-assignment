// src/services/conversation/getOrCreateConversation.service.ts
import { ConversationRepository } from "../../repositories/conversation.repository";
import { BlockRepository } from "../../repositories/block.repository";
import { UserRepository } from "../../repositories/user.repository";

export async function getOrCreateConversationService(
  viewerId: string,
  otherUserId: string
) {
  if (viewerId === otherUserId) {
    const err: any = new Error("You cannot message yourself");
    err.status = 400;
    throw err;
  }

  const otherUser = await UserRepository.findById(otherUserId);
  if (!otherUser) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const blocked = await BlockRepository.isBlockedEitherWay(
    viewerId,
    otherUserId
  );
  if (blocked) {
    const err: any = new Error("User is blocked");
    err.status = 403;
    throw err;
  }

  const conversation =
    (await ConversationRepository.findOneToOne(viewerId, otherUserId)) ??
    (await ConversationRepository.createOneToOne(viewerId, otherUserId));

  const other = conversation.participants.find(
    (p) => p.userId !== viewerId
  );

  return {
    id: conversation.id,
    participant: other
      ? {
          id: other.user.id,
          name: other.user.name,
          avatarUrl: other.user.avatarUrl,
        }
      : null,
  };
}
