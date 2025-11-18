import { z } from "zod";

export const toggleLikeSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid media id format" }),
  }),
});
