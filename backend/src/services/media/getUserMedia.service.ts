// src/services/media/getUserMedia.service.ts
import { UserRepository } from "../../repositories/user.repository";

interface GetUserMediaParams {
  userId: string;
  page: number;
  limit: number;
}

export async function getUserMediaService({
  userId,
  page,
  limit,
}: GetUserMediaParams) {
  const user = await UserRepository.findById(userId);
  if (!user) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    UserRepository.listUserMedia({ userId, skip, take: limit }),
    UserRepository.countUserMedia({ userId }),
  ]);

  return {
    items,
    page,
    limit,
    total,
    hasMore: skip + items.length < total,
  };
}
