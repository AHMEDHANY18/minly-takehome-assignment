// src/services/user/getMyProfile.service.ts
import { getUserProfileByIdService } from "./getUserProfileById.service";

export async function getMyProfileService(userId: string) {
  // بس بنعيد استخدام نفس اللوجيك
  return getUserProfileByIdService(userId);
}
