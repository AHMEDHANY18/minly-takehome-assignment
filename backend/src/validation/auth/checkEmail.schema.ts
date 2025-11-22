import { z } from "zod";

export const checkEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
  }),
});

export type CheckEmailInput = z.infer<typeof checkEmailSchema>;
