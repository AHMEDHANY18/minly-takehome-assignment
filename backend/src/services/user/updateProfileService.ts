import { MediaRepository } from "../../repositories/media.repository";
import { uploadAvatarBuffer } from "../../utilities/storage/uploadAvatarBuffer";
import { deleteFromS3 } from "../../utilities/storage/deleteFromS3";
import { extractS3Key } from "../../utilities/storage/extractS3Key";

export async function updateProfileService(userId: string, data: any, file?: Express.Multer.File) {
  // 1) Get user
  const user = await UserRepository.findById(userId);

  if (!user) {
    const error: any = new Error("User not found");
    error.status = 404;
    throw error;
  }

  let avatarUrl = user.avatarUrl;

  // 2) If avatar file is uploaded → upload to S3
  if (file) {
    // delete old avatar if exists
    if (avatarUrl) {
      const oldKey = extractS3Key(avatarUrl);
      await deleteFromS3(oldKey);
    }

    // upload new avatar
    const uploadResult = await uploadAvatarBuffer({
      userId,
      file,
    });

    avatarUrl = uploadResult.url;
  }

  // 3) Update user in DB
  const updatedUser = await UserRepository.updateUser(userId, {
    ...data,
    avatarUrl,
  });

  return updatedUser;
}
