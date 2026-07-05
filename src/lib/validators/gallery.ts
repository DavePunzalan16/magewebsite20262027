import { z } from "zod";

export const createGalleryItemSchema = z.object({
  title: z.string().min(1, "Title required").max(200),
  category: z.string().max(50).optional(),
  image_url: z.string().url("Valid image URL required"),
  alt_text: z.string().max(300).optional(),
  is_featured: z.boolean().default(false),
});

export const updateGalleryItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().max(50).optional(),
  alt_text: z.string().max(300).optional(),
  is_featured: z.boolean().optional(),
});

export type CreateGalleryInput = z.infer<typeof createGalleryItemSchema>;
export type UpdateGalleryInput = z.infer<typeof updateGalleryItemSchema>;
