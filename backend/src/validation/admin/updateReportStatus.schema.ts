import { z } from "zod";

export const updateReportStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(["REVIEWED", "DISMISSED"]),
  }),
});

export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
