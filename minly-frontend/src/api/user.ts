// src/api/user.ts
import type { AxiosResponse } from "axios";
import { api } from "./axios";

export type MeData = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  mediaCount: number;
  totalLikesReceived: number;
  totalLikesGiven: number;
  createdAt: string;
};

type UserResponse = { status: string; data: MeData };

export const UserAPI = {
  getMe(): Promise<AxiosResponse<UserResponse>> {
    return api.get<UserResponse>("/user/me");
  },
  getById(userId: string): Promise<AxiosResponse<UserResponse>> {
    return api.get<UserResponse>(`/user/${userId}`);
  },
  updateMe(params: { name?: string; email?: string; file?: File }): Promise<
    AxiosResponse<UserResponse>
  > {
    const form = new FormData();

    if (params.name) form.append("name", params.name);
    if (params.email) form.append("email", params.email);
    if (params.file) form.append("file", params.file);

    return api.patch<UserResponse>("/user", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
