import type { Request, Response } from "express";
import axios from "axios";
import { mustEnv } from "../../utilities/authCookies";
import { verifyCognitoToken } from "./cognito/cognito.verify";
import { cognitoExchangeCode } from "./cognito/cognito.exchange";
import { cognitoUserInfo } from "./cognito/cognito.userinfo";
import { readOAuthCookies, clearOAuthCookies } from "./cookies/oauthCookies";
import { setAccessCookie, setRefreshCookie } from "./cookies/authCookies";
import { isAllowedAppRedirect } from "./oauth/redirectGuard";
import { UserRepository } from "../../repositories/user.repository";

export async function handleCallback(req: Request, res: Response) {
  const domain = mustEnv("COGNITO_DOMAIN").replace(/\/+$/, "");
  const clientId = mustEnv("COGNITO_CLIENT_ID");
  const redirectUri = mustEnv("COGNITO_REDIRECT_URI");
  const frontendUrl = mustEnv("FRONTEND_URL").replace(/\/+$/, "");
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;

  const code = req.query.code?.toString();
  const state = req.query.state?.toString();

  if (!code) return res.status(400).json({ message: "Missing code" });
  if (!state) return res.status(400).json({ message: "Missing state" });

  const cookies = readOAuthCookies(req);
  if (!cookies.state) return res.status(400).json({ message: "Missing oauth_state cookie" });
  if (state !== cookies.state) return res.status(400).json({ message: "Invalid state" });
  if (!cookies.pkceVerifier) return res.status(400).json({ message: "Missing PKCE verifier" });

  try {
    const tokenData = await cognitoExchangeCode({
      domain,
      clientId,
      clientSecret,
      redirectUri,
      code,
      codeVerifier: cookies.pkceVerifier,
    });

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    if (!accessToken) {
      return res.status(400).json({ message: "Missing access_token from Cognito" });
    }

    const accessPayload = await verifyCognitoToken<any>(accessToken, {
      expectedUse: "access",
      clientId,
    });

    const userInfo = await cognitoUserInfo({ domain, accessToken });

    const email = userInfo?.email;
    if (!email) return res.status(400).json({ message: "Missing email (check scopes)" });

    const name =
      userInfo?.name ??
      [userInfo?.given_name, userInfo?.family_name].filter(Boolean).join(" ") ??
      email;

    const avatarUrl = userInfo?.picture ?? null;

    await UserRepository.upsertOAuthUser({
      email,
      name,
      avatarUrl,
      identities: [{ provider: "cognito", providerId: accessPayload.sub }],
    });

    // cookies
    const accessMaxAgeMs =
      typeof tokenData?.expires_in === "number"
        ? tokenData.expires_in * 1000
        : 60 * 60 * 1000;

    setAccessCookie(res, accessToken, accessMaxAgeMs);
    if (refreshToken) {
      setRefreshCookie(res, refreshToken, 30 * 24 * 60 * 60 * 1000);
    }

    clearOAuthCookies(res);

    // mobile redirect
    const appRedirect = cookies.postLoginRedirect;
    if (appRedirect && isAllowedAppRedirect(appRedirect)) {
      const u = new URL(appRedirect);

      // NOTE: this is what you had (token in deep link)
      u.searchParams.set("token", accessToken);

      return res.redirect(u.toString());
    }

    // web redirect
    return res.redirect(`${frontendUrl}/auth/success`);
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      return res.status(400).json({
        message: "Cognito request failed",
        details: err.response?.data ?? err.message,
      });
    }
    return res.status(500).json({
      message: "Unexpected error",
      details: err?.message ?? String(err),
    });
  }
}
