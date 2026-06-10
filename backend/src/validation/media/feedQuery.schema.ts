import { z } from "zod";

export const feedQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    cursor: z.string().optional(),
  }),
});

export type FeedQueryInput = z.infer<typeof feedQuerySchema>;
