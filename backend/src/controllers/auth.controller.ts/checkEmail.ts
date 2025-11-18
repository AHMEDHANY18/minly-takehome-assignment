import { Request, Response, NextFunction } from "express";
import { checkEmailService } from "../../services/auth";

export async function checkEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    const result = await checkEmailService(email);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
