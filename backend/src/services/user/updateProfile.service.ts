import { UserRepository } from "../../repositories/user.repository";
import { uploadMediaBuffer } from "../../utilities/storage/uploadToS3";

interface UpdateProfileData {
  name?: string;
}

export async function updateProfileService(
  userId: string,
  data: UpdateProfileData,
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


  // 3) build update data object
  const updateData: any = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
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
