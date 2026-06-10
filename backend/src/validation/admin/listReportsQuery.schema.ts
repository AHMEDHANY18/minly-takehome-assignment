import { z } from "zod";

export const listReportsQuerySchema = z.object({
  query: z.object({
    status: z.enum(["PENDING", "REVIEWED", "DISMISSED"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export type ListReportsQueryInput = z.infer<typeof listReportsQuerySchema>;
