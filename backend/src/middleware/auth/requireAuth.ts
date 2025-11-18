import { Request, Response, NextFunction } from "express";
import { jwtVerify } from "../../utilities/encryption/jwtVerify";

export interface AuthRequest extends Request {
  user?: { id: string };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    console.log("🚀 ~ authHeader:", authHeader)

    if (!authHeader) {
      return res.status(401).json({
        status: "error",
        message: "You don't have permission",
      });
    }

    const token = authHeader
    console.log("🚀 ~ token:", token)

    const decoded = await jwtVerify(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    req.user = { id: decoded.userId };

    next();
  } catch (err) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
}
