import { z } from "zod";

export const createMediaSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(500).optional(),
    type: z.enum(["IMAGE", "VIDEO"]).optional(),
  }),
});

export type CreateMediaInput = z.infer<typeof createMediaSchema>;
