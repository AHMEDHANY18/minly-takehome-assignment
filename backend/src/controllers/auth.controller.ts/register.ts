import { Request, Response, NextFunction } from "express";
import { registerService } from "../../services/auth";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;

    const result = await registerService(name, email, password);

    return res.status(201).json({
      message: "User registered successfully",
      ...result,
    });
  } catch (err) {
    next(err);
  }
}
