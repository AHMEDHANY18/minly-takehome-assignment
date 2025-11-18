// src/validations/user/getUserProfileByIdSchema.ts
import { z } from "zod";

export const getUserProfileByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid user id format" }),
  }),
});
