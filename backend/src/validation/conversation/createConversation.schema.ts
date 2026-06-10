import { z } from "zod";

export const createConversationSchema = z.object({
  body: z.object({
    userId: z.string().uuid({ message: "Invalid user id format" }),
  }),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
