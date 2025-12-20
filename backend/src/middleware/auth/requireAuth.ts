// src/middleware/auth/requireAuth.ts
import type { Response, NextFunction } from "express";
import { verifyCognitoToken } from "../../services/auth/cognito/cognito.verify";
import { UserRepository } from "../../repositories/user.repository";
import type { AuthRequest } from "./types";

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const clientId = process.env.COGNITO_CLIENT_ID!;

    const auth = req.headers.authorization;
    const bearer = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : undefined;

    const token = bearer || req.cookies?.access_token;
    if (!token) return res.status(401).json({ code: "NO_TOKEN", message: "Unauthorized" });

    const payload = await verifyCognitoToken<any>(token, {
      expectedUse: "access",
      clientId,
    });

    const user = await UserRepository.findByCognitoSub(payload.sub);
    if (!user) return res.status(401).json({ code: "USER_NOT_LINKED", message: "User not linked" });

    req.user = user;
    return next();
  } catch (err: any) {
    // IMPORTANT: distinguish expired (so frontend can refresh) vs invalid
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ code: "TOKEN_EXPIRED", message: "Access token expired" });
    }
    return res.status(401).json({ code: "INVALID_TOKEN", message: "Invalid token" });
  }
}
