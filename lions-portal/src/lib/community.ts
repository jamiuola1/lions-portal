import { z } from "zod";

export const MAX_FILES = 4;
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const postSchema = z.object({
  categoryId: z.number().int().positive(),
  body: z.string().trim().min(1, "Write something first.").max(5000, "Keep posts under 5,000 characters."),
});
export const commentSchema = z.object({
  postId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  body: z.string().trim().min(1, "Write a comment first.").max(2000, "Keep comments under 2,000 characters."),
});
export const reportSchema = z.object({
  kind: z.enum(["post", "comment"]),
  id: z.string().uuid(),
  reason: z.string().trim().min(3, "Tell us briefly what's wrong.").max(500),
});
export const safeFileName = (n: string) => n.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80) || "file";
