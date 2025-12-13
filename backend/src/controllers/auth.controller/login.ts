// import { Request, Response, NextFunction } from "express";
// import { loginService } from "../../services/auth";
// import { loginSchema } from "../../validation/auth/login.schema";

// export async function login(req: Request, res: Response, next: NextFunction) {
//     try {
//         const parsed = loginSchema.safeParse(req.body);

//         if (!parsed.success) {
//           const errors = parsed.error.flatten().fieldErrors;
//           return res.status(400).json({ status: "error", errors });
//         }

//         const { email, password } = parsed.data;

//         const result = await loginService(email, password);

//         return res.status(200).json({
//           message: "Login successful",
//           ...result,
//         });
//       } catch (err) {
//         next(err);
//       }
// }
