import { deleteMediaService } from "../media/deleteMedia.service";
import { AdminRepository } from "../../repositories/admin.repository";

export async function adminDeleteMediaService(mediaId: string, adminId: string) {
  await deleteMediaService(mediaId, adminId, { asAdmin: true });

  // related PENDING reports are considered handled
  await AdminRepository.markPendingReportsReviewed("MEDIA", mediaId);

  return { id: mediaId, deleted: true };
}
