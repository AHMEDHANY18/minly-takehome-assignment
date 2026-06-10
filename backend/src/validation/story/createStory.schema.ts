import { z } from "zod";

export const createStorySchema = z.object({
  body: z.object({
    // S3 public URL produced by the existing presign + PUT flow
    url: z.string().url(),
    type: z.enum(["IMAGE", "VIDEO"]),
  }),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
