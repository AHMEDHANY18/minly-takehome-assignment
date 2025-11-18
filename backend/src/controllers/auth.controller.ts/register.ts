import { Request, Response, NextFunction } from "express";
import { registerService } from "../../services/auth";
import { registerSchema } from "../../validation/auth/registerSchema";
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return res.status(400).json({
        message: "Validation error",
        errors,
      });
    }

    const { name, email, password } = parsed.data;

    const result = await registerService(name, email, password);

    return res.status(201).json({
      message: "User registered successfully",
      ...result,
    });
  } catch (err) {
    next(err);
  }
}
