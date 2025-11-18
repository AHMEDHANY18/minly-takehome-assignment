import { Request, Response, NextFunction } from "express";
import { loginService } from "../../services/auth";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const result = await loginService(email, password);

    return res.status(200).json({
      message: "Login successful",
      ...result,
    });
  } catch (err) {
    next(err);
  }
}
