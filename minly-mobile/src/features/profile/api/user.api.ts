import type { AxiosResponse } from "axios";
import { api } from "@/api/client";
import type { MediaItem } from "@/types/media";
import type { User } from "@/types/user";

export type MeData = User & {
  mediaCount: number;
  totalLikesReceived: number;
  totalLikesGiven: number;
  media: MediaItem[];
};

type MeResponse = { status: string; data: MeData };

export const UserAPI = {
  getMe(): Promise<AxiosResponse<MeResponse>> {
    return api.get<MeResponse>("/user/me");
  },
  getById(userId: string): Promise<AxiosResponse<MeResponse>> {
    return api.get<MeResponse>(`/user/${userId}`);
  },
  updateMe(form: FormData): Promise<AxiosResponse<MeResponse>> {
    return api.patch<MeResponse>("/user", form, {
      headers: { "Content-Type": "multipart/form-data" },
      transformRequest: (d) => d,
    });
  },
};
