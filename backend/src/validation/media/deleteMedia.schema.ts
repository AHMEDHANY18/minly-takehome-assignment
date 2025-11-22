import { z } from "zod";

export const deleteMediaSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid media id format" }),
  }),
});

export type DeleteMediaInput = z.infer<typeof deleteMediaSchema>;
