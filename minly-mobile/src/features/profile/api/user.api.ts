import { api } from "@/api/client";
import type { AxiosResponse } from "axios";

export type ProfileUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type UpdateMeBody = {
  name?: string;
  avatarKey?: string;
};

export const UserAPI = {
  updateMe(body: UpdateMeBody) {
    return api.patch<{ status: "success"; data: ProfileUser }>("/user", body);
  },
};
