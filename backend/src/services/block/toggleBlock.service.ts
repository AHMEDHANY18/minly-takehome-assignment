// src/services/block/toggleBlock.service.ts
import { BlockRepository } from "../../repositories/block.repository";
import { UserRepository } from "../../repositories/user.repository";

export async function toggleBlockService(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    const err: any = new Error("You cannot block yourself");
    err.status = 400;
    throw err;
  }

  const targetUser = await UserRepository.findById(blockedId);
  if (!targetUser) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const existing = await BlockRepository.findBlock(blockerId, blockedId);

  // -----------------------------
  // BLOCK (+ remove follow relations both ways)
  // -----------------------------
  if (!existing) {
    await BlockRepository.createBlockWithCleanup(blockerId, blockedId);
    return { userId: blockedId, isBlocked: true };
  }

  // -----------------------------
  // UNBLOCK
  // -----------------------------
  await BlockRepository.deleteBlock(existing.id);
  return { userId: blockedId, isBlocked: false };
}
