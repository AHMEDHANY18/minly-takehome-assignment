import { z } from "zod";

export const getMediaByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid media id format" }),
  }),
});

export type GetMediaByIdInput = z.infer<typeof getMediaByIdSchema>;
