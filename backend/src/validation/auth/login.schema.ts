import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Invalid email or password"),
});

export type LoginInput = z.infer<typeof loginSchema>;
