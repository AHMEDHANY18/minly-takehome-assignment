import type { Response } from "express";
import { cookieOpts } from "../../../utilities/authCookies";

export function setAccessCookie(res: Response, accessToken: string, maxAgeMs: number) {
  res.cookie("access_token", accessToken, {
    ...cookieOpts(),
    maxAge: maxAgeMs,
    path: "/",
  });
}

export function setRefreshCookie(res: Response, refreshToken: string, maxAgeMs: number) {
  res.cookie("refresh_token", refreshToken, {
    ...cookieOpts(),
    maxAge: maxAgeMs,
    path: "/v1/auth/refresh",
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/v1/auth/refresh" });
}
