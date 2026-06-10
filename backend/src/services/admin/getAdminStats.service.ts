import { AdminRepository } from "../../repositories/admin.repository";

export async function getAdminStatsService() {
  return AdminRepository.getStats();
}
