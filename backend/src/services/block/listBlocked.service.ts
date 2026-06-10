// src/services/block/listBlocked.service.ts
import { BlockRepository } from "../../repositories/block.repository";

export async function listBlockedService(blockerId: string) {
  const rows = await BlockRepository.listBlockedUsers(blockerId);

  return {
    users: rows.map((row) => ({
      id: row.blocked.id,
      name: row.blocked.name,
      avatarUrl: row.blocked.avatarUrl,
      blockedAt: row.createdAt,
    })),
  };
}
