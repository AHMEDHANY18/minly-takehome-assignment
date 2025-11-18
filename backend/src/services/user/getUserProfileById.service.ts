// src/services/user/getUserProfileById.service.ts
import { UserRepository } from "../../repositories/user.repository";

export async function getUserProfileByIdService(userId: string) {
  const user = await UserRepository.findByIdWithMedia(userId);

  if (!user) {
    const error: any = new Error("User not found");
    error.status = 404;
    throw error;
  }

  // منرجعش email / passwordHash
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    mediaCount: user.mediaCount,
    totalLikesReceived: user.totalLikesReceived,
    totalLikesGiven: user.totalLikesGiven,
    createdAt: user.createdAt,
    media: user.media, // فيها كل الصور والفيديوهات بتاعته
  };
}
