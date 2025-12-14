import { MediaRepository } from "../../repositories/media.repository";
import { LikeRepository } from "../../repositories/like.repository";
import { UserRepository } from "../../repositories/user.repository";
import { NotificationRepository } from "../../repositories/notification.repository";

export async function toggleLikeService(mediaId: string, userId: string) {
  if (!userId) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  const user = await UserRepository.findById(userId);
  if (!user) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // 1) تأكد إن الميديا موجودة
  const media = await MediaRepository.findById(mediaId);
  if (!media) {
    const err: any = new Error("Media not found");
    err.status = 404;
    throw err;
  }

  const mediaOwnerId = media.uploaderId;

  // 2) هل اليوزر عامل like بالفعل؟
  const existingLike = await LikeRepository.findByUserAndMedia(
    userId,
    mediaId
  );

  // 3) لو مش عامل like → نعمل like + Notification
  if (!existingLike) {
    const result = await LikeRepository.createLikeWithCounters({
      userId,
      mediaId,
      mediaOwnerId,
    });

    // 🔔 REAL-TIME NOTIFICATION (LIKE)
    if (mediaOwnerId !== userId) {
      await NotificationRepository.create({
        type: "LIKE",
        actorId: userId,
        targetUserId: mediaOwnerId,
        mediaId: mediaId,
      });
    }

    return {
      mediaId,
      isLiked: true,
      likesCount: result.updatedLikesCount,
    };
  }

  // 4) لو عامل like → نشيل الـ like (مفيش Notification)
  const result = await LikeRepository.deleteLikeWithCounters({
    likeId: existingLike.id,
    userId,
    mediaId,
    mediaOwnerId,
  });

  return {
    mediaId,
    isLiked: false,
    likesCount: result.updatedLikesCount,
  };
}
