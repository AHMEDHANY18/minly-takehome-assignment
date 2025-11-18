import z from "zod";

export const updateProfileSchema = z.object({
    body: z.object({
      name: z.string().min(2).optional(),
      bio: z.string().max(200).optional(),
    }),
  });
