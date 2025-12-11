// src/services/user/getUserProfileById.service.ts
import { UserRepository } from "../../repositories/user.repository";

export async function getUserProfileByIdService(userId: string) {
  const user = await UserRepository.findByIdWithMedia(userId);

  if (!user) {
    const error: any = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return user
}
