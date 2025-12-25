import type { Request, Response } from "express";
import { mustEnv } from "../../utilities/authCookies";
import { generatePKCE, generateState } from "./oauth/pkce";
import { isAllowedAppRedirect } from "./oauth/redirectGuard";
import { setOAuthCookies } from "./cookies/oauthCookies";

export async function startLogin(req: Request, res: Response) {
  const domain = mustEnv("COGNITO_DOMAIN").replace(/\/+$/, "");
  const clientId = mustEnv("COGNITO_CLIENT_ID");
  const redirectUri = mustEnv("COGNITO_REDIRECT_URI");

  const state = generateState();
  const { verifier, challenge } = generatePKCE();

  const appRedirect = req.query.app_redirect?.toString();
  setOAuthCookies(res, {
    state,
    pkceVerifier: verifier,
    appRedirect: appRedirect && isAllowedAppRedirect(appRedirect) ? appRedirect : undefined,
  });

  const scope = encodeURIComponent("openid email profile");
  const forceLogin = process.env.COGNITO_FORCE_LOGIN === "1";
  const prompt = forceLogin ? `&prompt=login` : "";

  const url =
    `${domain}/oauth2/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(state)}` +
    `&code_challenge=${encodeURIComponent(challenge)}` +
    `&code_challenge_method=S256` +
    `&response_mode=query` +
    prompt;

  return res.redirect(url);
}
