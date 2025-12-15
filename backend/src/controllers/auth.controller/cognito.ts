import { Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import { verifyCognitoToken } from "../../services/auth/cognito/cognito.verify";
import { UserRepository } from "../../repositories/user.repository";

function base64Url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest();
}

function cookieOpts() {
  const secure = process.env.NODE_ENV === "production";
  console.log("🚀 ~ cookieOpts ~ secure:", secure)
  const sameSiteEnv = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
  console.log("🚀 ~ cookieOpts ~ sameSiteEnv:", sameSiteEnv)
  const sameSite =
    sameSiteEnv === "none"
      ? ("none" as const)
      : sameSiteEnv === "strict"
      ? ("strict" as const)
      : ("lax" as const);

  return {
    httpOnly: true,
    secure:false,
    sameSite,
  };
}

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export async function cognitoLogin(req: Request, res: Response) {
  const domain = mustEnv("COGNITO_DOMAIN").replace(/\/+$/, "");
  console.log("🚀 ~ cognitoLogin ~ domain:", domain)
  const clientId = mustEnv("COGNITO_CLIENT_ID");
  const redirectUri = mustEnv("COGNITO_REDIRECT_URI");

  // state + PKCE
  const state = base64Url(crypto.randomBytes(32));
  const codeVerifier = base64Url(crypto.randomBytes(64));
  const codeChallenge = base64Url(sha256(codeVerifier));

  // cookies (short-lived)
  res.cookie("oauth_state", state, { ...cookieOpts(), maxAge: 10 * 60 * 1000 });
  res.cookie("pkce_verifier", codeVerifier, {
    ...cookieOpts(),
    maxAge: 10 * 60 * 1000,
  });

  const scope = encodeURIComponent("openid email profile");
  console.log("🚀 ~ cognitoLogin ~ scope:", scope)
  const url =
  `${domain}/oauth2/authorize` +
  `?response_type=code` +
  `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(state)}` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}` +
    `&code_challenge_method=S256`;
    `&response_mode=query` +   // ✅ مهم
    `&prompt=login`;

    console.log("🚀 ~ cognitoLogin ~ url:", url)
  return res.redirect(url);
}

export async function cognitoCallback(req: Request, res: Response) {
  const domain = mustEnv("COGNITO_DOMAIN").replace(/\/+$/, "");
  const clientId = mustEnv("COGNITO_CLIENT_ID");
  const clientSecret = process.env.COGNITO_CLIENT_SECRET; // optional
  const redirectUri = mustEnv("COGNITO_REDIRECT_URI");
  const frontendUrl = mustEnv("FRONTEND_URL").replace(/\/+$/, "");

  try {
    const code = req.query.code?.toString();
    console.log("🚀 ~ cognitoCallback ~ code:", code)
    const state = req.query.state?.toString();
    console.log("🚀 ~ cognitoCallback ~ state:", state)

    if (!code) return res.status(400).json({ message: "Missing code" });
    if (!state) return res.status(400).json({ message: "Missing state" });

    // validate state
    const savedState = req.cookies?.oauth_state;
    if (!savedState) return res.status(400).json({ message: "Missing oauth_state cookie" });

    if (state && state !== savedState) {
      return res.status(400).json({ message: "Invalid state" });
    }

    const codeVerifier = req.cookies?.pkce_verifier;
    if (!codeVerifier) {
      return res.status(400).json({ message: "Missing PKCE verifier" });
    }

    // exchange code -> tokens
    const tokenUrl = `${domain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    console.log("🚀 ~ cognitoCallback ~ tokenUrl:", tokenUrl)
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    // If you configured a secret, use Basic (confidential client)
    if (clientSecret) {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      headers.Authorization = `Basic ${basic}`;
    }

    const { data } = await axios.post(tokenUrl, body.toString(), { headers });

    const accessToken: string | undefined = data?.access_token;
    const refreshToken: string | undefined = data?.refresh_token;

    if (!accessToken) {
      return res.status(400).json({ message: "Missing access_token from Cognito" });
    }

    // verify ACCESS token (this is what protects APIs)
    const accessPayload = await verifyCognitoToken<any>(accessToken, {
      expectedUse: "access",
      clientId,
    });

    // fetch user profile from userInfo (requires scope openid/profile/email)
    const { data: userInfo } = await axios.get(`${domain}/oauth2/userInfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const email = userInfo?.email;
    if (!email) return res.status(400).json({ message: "Missing email (check scopes)" });

    const name =
      userInfo?.name ??
      [userInfo?.given_name, userInfo?.family_name].filter(Boolean).join(" ") ??
      email;

    const avatarUrl = userInfo?.picture ?? null;

    // Link user in DB by Cognito sub
    const user = await UserRepository.upsertOAuthUser({
      email,
      name,
      avatarUrl,
      identities: [{ provider: "cognito", providerId: accessPayload.sub }],
    });

    // set auth cookies
    const common = cookieOpts();

    // access cookie (short)
    const accessMaxAgeMs =
      typeof data?.expires_in === "number" ? data.expires_in * 1000 : 60 * 60 * 1000;

    res.cookie("access_token", accessToken, {
      ...common,
      maxAge: accessMaxAgeMs,
      path: "/", // used by all APIs
    });

    // refresh cookie (longer, restricted path)
    if (refreshToken) {
      res.cookie("refresh_token", refreshToken, {
        ...common,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30d (حسب إعدادات Cognito)
        path: "/v1/auth/refresh",
      });
    }

    // cleanup oauth temp cookies
    res.clearCookie("oauth_state", { path: "/" });
    res.clearCookie("pkce_verifier", { path: "/" });

    // redirect to frontend (logged in)
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

export async function authMe(req: Request, res: Response) {
  // user will be attached by requireAuth middleware
  // @ts-ignore
  return res.json({ user: req.user });
}

export async function authRefresh(req: Request, res: Response) {
  const domain = mustEnv("COGNITO_DOMAIN").replace(/\/+$/, "");
  const clientId = mustEnv("COGNITO_CLIENT_ID");
  const clientSecret = process.env.COGNITO_CLIENT_SECRET; // optional

  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) return res.status(401).json({ message: "Missing refresh token" });

    const tokenUrl = `${domain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: refreshToken,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    if (clientSecret) {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      headers.Authorization = `Basic ${basic}`;
    }

    const { data } = await axios.post(tokenUrl, body.toString(), { headers });

    const accessToken: string | undefined = data?.access_token;
    if (!accessToken) return res.status(400).json({ message: "Missing access_token" });

    // verify ACCESS token
    await verifyCognitoToken(accessToken, { expectedUse: "access", clientId });

    res.cookie("access_token", accessToken, {
      ...cookieOpts(),
      maxAge:
        typeof data?.expires_in === "number" ? data.expires_in * 1000 : 60 * 60 * 1000,
      path: "/",
    });

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(401).json({ message: "Refresh failed", details: err?.message });
  }
}

export async function authLogout(req: Request, res: Response) {
  const domain = mustEnv("COGNITO_DOMAIN").replace(/\/+$/, "");
  const clientId = mustEnv("COGNITO_CLIENT_ID");
  const logoutRedirect = mustEnv("COGNITO_LOGOUT_REDIRECT_URI");

  // clear cookies
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/v1/auth/refresh" });

  const url =
    `${domain}/logout` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&logout_uri=${encodeURIComponent(logoutRedirect)}`;

  return res.redirect(url);
}
