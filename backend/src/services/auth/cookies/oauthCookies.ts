import type { Response } from "express";
import { cookieOpts } from "../../../utilities/authCookies";

const TEMP_PATH = "/v1/auth";
const TTL_MS = 10 * 60 * 1000;

export function setOAuthCookies(
  res: Response,
  args: { state: string; pkceVerifier: string; appRedirect?: string }
) {
  res.cookie("oauth_state", args.state, { ...cookieOpts(), maxAge: TTL_MS, path: TEMP_PATH });
  res.cookie("pkce_verifier", args.pkceVerifier, { ...cookieOpts(), maxAge: TTL_MS, path: TEMP_PATH });

  if (args.appRedirect) {
    res.cookie("post_login_redirect", args.appRedirect, {
      ...cookieOpts(),
      maxAge: TTL_MS,
      path: TEMP_PATH,
    });
  }
}

export function clearOAuthCookies(res: Response) {
  res.clearCookie("oauth_state", { path: TEMP_PATH });
  res.clearCookie("pkce_verifier", { path: TEMP_PATH });
  res.clearCookie("post_login_redirect", { path: TEMP_PATH });
}

export function readOAuthCookies(req: any) {
  return {
    state: req.cookies?.oauth_state as string | undefined,
    pkceVerifier: req.cookies?.pkce_verifier as string | undefined,
    postLoginRedirect: req.cookies?.post_login_redirect as string | undefined,
  };
}
