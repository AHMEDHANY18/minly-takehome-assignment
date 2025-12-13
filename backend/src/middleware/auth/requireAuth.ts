// src/middleware/auth/requireAuth.ts
import { Request, Response, NextFunction } from "express";
import { verifyCognitoToken } from "../../services/auth/cognito/cognito.verify";
import { UserRepository } from "../../repositories/user.repository";
import { AuthRequest } from "./types";

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    /**
     * 1) Read Authorization header
     */
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = auth.split(" ")[1];

    /**
     * 2) Verify Cognito token (JWT)
     */
    const payload = await verifyCognitoToken(token);

    if (!payload?.sub) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    /**
     * 3) Resolve user via OAuthAccount (cognito sub)
     */
    const user = await UserRepository.findByCognitoSub(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "User not linked" });
    }

    /**
     * 4) Attach user to request
     */
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
