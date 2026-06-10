import { z } from "zod";

export const sendMessageSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid conversation id format" }),
  }),
  body: z.object({
    text: z.string().min(1).max(1000),
  }),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
