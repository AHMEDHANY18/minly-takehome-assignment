import { Request, Response, NextFunction } from "express";
import { jwtVerify } from "../../utilities/encryption/jwtVerify";
import { prisma } from "../../config/prisma";

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

    if (!authHeader) {
      return res.status(401).json({
        status: "error",
        message: "You don't have permission",
      });
    }

    const token = authHeader

    const decoded = await jwtVerify(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User does not exist",
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
