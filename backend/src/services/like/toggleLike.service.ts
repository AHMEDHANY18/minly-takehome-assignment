import { MediaRepository } from "../../repositories/media.repository";
import { LikeRepository } from "../../repositories/like.repository";
import { UserRepository } from "../../repositories/user.repository";
import { error } from "console";

export async function toggleLikeService(mediaId: string, userId: string) {


  if (!userId) {
    const error: any = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  const getUser= await UserRepository.findById(userId);
  if (!getUser) {
    //throw
    throw error
  }

  // 1) تأكد إن الميديا موجودة
  const media = await MediaRepository.findById(mediaId);

  if (!media) {
    const error: any = new Error("Media not found");
    error.status = 404;
    throw error;
  }

  const mediaOwnerId = media.uploaderId;

  // 2) هل اليوزر عامل like بالفعل؟
  const existingLike = await LikeRepository.findByUserAndMedia(userId, mediaId);

  // 3) لو مش عامل like → نعمل like
  if (!existingLike) {
    const result = await LikeRepository.createLikeWithCounters({
      userId,
      mediaId,
      mediaOwnerId,
    });

    return {
      mediaId,
      isLiked: true,
      likesCount: result.updatedLikesCount,
    };
  }

  // 4) لو عامل like → نشيل الـ like
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
