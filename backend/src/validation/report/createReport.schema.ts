import { z } from "zod";

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(["MEDIA", "COMMENT", "USER"]),
    targetId: z.string().min(1),
    reason: z.enum(["SPAM", "ABUSE", "INAPPROPRIATE", "OTHER"]),
    details: z.string().max(1000).optional(),
  }),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
