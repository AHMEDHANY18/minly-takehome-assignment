import { z } from "zod";

export const finalizeMediaSchema = z.object({
  body: z.object({
    kind: z.enum(["media", "avatar"]),
    key: z.string().min(1),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(500).optional(),
    type: z.enum(["IMAGE", "VIDEO"]).optional(),
    thumbnailUrl: z.string().url().optional(),
  }),
});

export type FinalizeMediaInput = z.infer<typeof finalizeMediaSchema>;
