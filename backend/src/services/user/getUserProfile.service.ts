// src/services/user/getUserProfile.service.ts
import { MediaType } from "@prisma/client";
import { UserRepository } from "../../repositories/user.repository";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function getUserProfileService(params: {
  viewerId: string;
  userId: string;
  page: number;
  limit: number;
  type: string; // ALL | IMAGE | VIDEO
}) {
  const page = clamp(params.page, 1, 10_000);
  const limit = clamp(params.limit, 1, 50);
  const skip = (page - 1) * limit;

  const mediaType: MediaType | undefined =
    params.type === "IMAGE" || params.type === "VIDEO"
      ? (params.type as MediaType)
      : undefined;

  const includeEmail = params.viewerId === params.userId; // privacy

  const [user, items, total] = await Promise.all([
    UserRepository.findProfileHeaderById(params.userId, { includeEmail }),
    UserRepository.listUserMedia({
      userId: params.userId,
      skip,
      take: limit,
      type: mediaType,
    }),
    UserRepository.countUserMedia({
      userId: params.userId,
      type: mediaType,
    }),
  ]);

  if (!user) {
    const error: any = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    user,
    media: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    meta: {
      tab: params.type.toUpperCase(),
      isMe: params.viewerId === params.userId,
    },
  };
}
