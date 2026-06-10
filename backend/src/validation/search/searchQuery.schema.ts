import { z } from "zod";

export const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1, { message: "q is required" }),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
