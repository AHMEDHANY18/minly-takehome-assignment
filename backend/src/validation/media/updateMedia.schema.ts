import { z } from "zod";

export const updateMediaSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid media id format" }),
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
});
