import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
  image_url: z.string().url().nullable().optional(),
  category: z.enum(["general", "announcement", "artwork", "gaming", "anime", "meme"]).default("general"),
  is_pinned: z.boolean().default(false),
});

export const updatePostSchema = z.object({
  id: z.number(),
  content: z.string().min(1).max(5000).optional(),
  image_url: z.string().url().nullable().optional(),
  category: z.enum(["general", "announcement", "artwork", "gaming", "anime", "meme"]).optional(),
  is_pinned: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
