import { api } from "./axios";

export type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
};

export const AuthAPI = {
  // 1) يبدأ لوجين: redirect browser (مش axios)
  startLogin() {
    window.location.href = "http://localhost:4000/v1/auth/login";
  },

  // 2) يجيب المستخدم الحالي عبر cookies
  me() {
    return api.get<MeResponse>("/auth/me");
  },

  // 3) يعمل logout ويمسح cookies من السيرفر
  startLogout() {
    window.location.href = "http://localhost:4000/v1/auth/logout";
  },
};
