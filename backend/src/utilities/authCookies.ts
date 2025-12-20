// src/utils/authCookies.ts
import type { CookieOptions } from "express";

export function cookieOpts(): CookieOptions {
  // default: production => none (cross-site), dev => lax
  const raw =
    (process.env.COOKIE_SAMESITE ??
      (process.env.NODE_ENV === "production" ? "none" : "lax")).toLowerCase();

  const sameSite =
    raw === "none"
      ? ("none" as const)
      : raw === "strict"
      ? ("strict" as const)
      : ("lax" as const);

  // SameSite=None MUST be Secure=true (browsers will reject otherwise)
  const secure = sameSite === "none" ? true : process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite,
  };
}

export function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}
