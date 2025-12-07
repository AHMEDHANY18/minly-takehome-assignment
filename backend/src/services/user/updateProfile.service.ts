import { UserRepository } from "../../repositories/user.repository";
import { uploadMediaBuffer } from "../../utilities/storage/uploadToS3";
import { deleteFromS3 } from "../../utilities/storage/deleteFromS3";
import { extractS3Key } from "../../utilities/storage/extractS3Key";

interface UpdateProfileData {
  email?: string;
  name?: string;
}

export async function updateProfileService(
  userId: string,
  data: UpdateProfileData,
  file?: Express.Multer.File
) {
  // 1) find user
  const user = await UserRepository.findById(userId);

  if (!user) {
    const error: any = new Error("User not found");
    error.status = 404;
    throw error;
  }

  let avatarUrl = user.avatarUrl;
  console.log("🚀 ~ avatarUrl:", avatarUrl)

  // 2) upload avatar if file exists
  if (file) {
    console.log("🚀 ~ file:", file)
    if (avatarUrl) {
      console.log("🚀 ~ avatarUrl:", avatarUrl)
      const key = extractS3Key(avatarUrl);
      await deleteFromS3(key);
    }

    const uploadResult = await uploadMediaBuffer({
      userId,
      file,
      kind: "avatar",
    });

    avatarUrl = uploadResult.url;
  }

  // 3) build update data object
  const updateData: any = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.email !== undefined) {
    updateData.email = data.email;
  }

  if (avatarUrl !== user.avatarUrl) {
    updateData.avatarUrl = avatarUrl;
  }

  if (Object.keys(updateData).length === 0) {
    return user;
  }

  let updatedUser;
  try {
    updatedUser = await UserRepository.updateUser(userId, updateData);
  } catch (error: any) {
    //race
    if (error?.code === "P2002" || error?.meta?.target?.includes("email")) {
      const err: any = new Error("Email already exists");
      err.status = 400;
      throw err;
    }
    throw error;
  }

  return updatedUser;
}
