import { z } from "zod";

export const editCommentSchema = z.object({
  params: z.object({
    commentId: z.string().uuid({ message: "Invalid comment id format" }),
  }),
  body: z.object({
    text: z.string().min(1).max(500),
  }),
});

export type EditCommentInput = z.infer<typeof editCommentSchema>;
