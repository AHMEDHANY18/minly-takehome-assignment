import { z } from "zod";

// avatars & video thumbnails must be images
const imageContentType = z
  .string()
  .regex(/^image\//, { message: "contentType must be an image" });

export const presignSchema = z.object({
  body: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("avatar"),
      contentType: imageContentType,
    }),
    z.object({
      kind: z.literal("thumbnail"),
      contentType: imageContentType,
    }),
    z.object({
      kind: z.literal("media"),
      contentType: z.string().min(1),
      type: z.enum(["IMAGE", "VIDEO"]).optional(),
    }),
  ]),
});

export type PresignInput = z.infer<typeof presignSchema>;
