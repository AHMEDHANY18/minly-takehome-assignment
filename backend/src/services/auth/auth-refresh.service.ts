import type { Request, Response } from "express";
import { mustEnv } from "../../utilities/authCookies";
import { cognitoRefreshToken } from "./cognito/cognito.exchange";
import { verifyCognitoToken } from "./cognito/cognito.verify";
import { setAccessCookie } from "./cookies/authCookies";

export async function refresh(req: Request, res: Response) {
  const domain = mustEnv("COGNITO_DOMAIN").replace(/\/+$/, "");
  const clientId = mustEnv("COGNITO_CLIENT_ID");
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;

  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ code: "NO_REFRESH", message: "Missing refresh token" });
  }

  try {
    const data = await cognitoRefreshToken({
      domain,
      clientId,
      clientSecret,
      refreshToken,
    });

    const accessToken = data.access_token;
    if (!accessToken) return res.status(400).json({ message: "Missing access_token" });

    await verifyCognitoToken(accessToken, { expectedUse: "access", clientId });

    const maxAgeMs = typeof data.expires_in === "number" ? data.expires_in * 1000 : 60 * 60 * 1000;
    setAccessCookie(res, accessToken, maxAgeMs);

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(401).json({ code: "REFRESH_FAILED", message: "Refresh failed", details: err?.message });
  }
}
