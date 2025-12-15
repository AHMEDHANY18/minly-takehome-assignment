import { Response, NextFunction } from "express";
import { verifyCognitoToken } from "../../services/auth/cognito/cognito.verify";
import { UserRepository } from "../../repositories/user.repository";
import { AuthRequest } from "./types";

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const clientId = process.env.COGNITO_CLIENT_ID!;

    // Prefer Bearer (useful for mobile), fallback to cookie (web BFF)
    const auth = req.headers.authorization;
    const bearer =
      auth && auth.startsWith("Bearer ") ? auth.split(" ")[1] : undefined;

    const token = bearer || req.cookies?.access_token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = await verifyCognitoToken<any>(token, {
      expectedUse: "access",
      clientId,
    });

    const user = await UserRepository.findByCognitoSub(payload.sub);
    if (!user) return res.status(401).json({ message: "User not linked" });

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
