import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRepository } from "../../repositories/user.repository";
import { setAccessCookie } from "./cookies/authCookies";

/**
 * Local development login — bypasses Cognito so the app is usable without
 * any AWS infrastructure. Enabled ONLY when DEV_AUTH=true (never in prod).
 *
 * It upserts a user, mints a local HS256 JWT signed with JWT_SECRET, and sets
 * the same `access_token` cookie the Cognito flow uses. `requireAuth` verifies
 * this token locally when DEV_AUTH=true.
 */
export const DEV_AUTH_ENABLED = () => process.env.DEV_AUTH === "true";

const DEV_PROVIDER = "cognito" as const; // reuse findByCognitoSub lookup path
const ACCESS_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function devLogin(req: Request, res: Response) {
  if (!DEV_AUTH_ENABLED()) {
    return res.status(404).json({ status: "error", message: "Not found" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res
      .status(500)
      .json({ status: "error", message: "JWT_SECRET is not configured" });
  }

  const email = (req.body?.email?.toString().trim() || "dev@minly.local").toLowerCase();
  const name = req.body?.name?.toString().trim() || email.split("@")[0] || "Dev User";
  const sub = `dev:${email}`;

  try {
    const user = await UserRepository.upsertOAuthUser({
      email,
      name,
      avatarUrl: null,
      identities: [{ provider: DEV_PROVIDER, providerId: sub }],
    });

    const token = jwt.sign(
      {
        sub,
        token_use: "access",
        client_id: process.env.COGNITO_CLIENT_ID ?? "dev-client",
        username: email,
      },
      secret,
      { expiresIn: ACCESS_TTL_SECONDS }
    );

    setAccessCookie(res, token, ACCESS_TTL_SECONDS * 1000);

    return res.json({ status: "success", data: { user, token } });
  } catch (err: any) {
    // Surface the real cause (usually a DB connection / schema issue) instead of hanging.
    console.error("[dev-login] failed:", err);
    return res.status(500).json({
      status: "error",
      message: err?.message ?? "Dev login failed",
    });
  }
}
