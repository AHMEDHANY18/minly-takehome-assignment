import { api } from "@/api/client";

export const MediaAPI = {
  updateMedia(mediaId: string, payload: { title: string | null; description: string | null }) {
    return api.patch(`/media/${mediaId}`, payload);
  },

  deleteMedia(mediaId: string) {
    return api.delete(`/media/${mediaId}`);
  },
};
