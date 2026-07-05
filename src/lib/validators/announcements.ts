import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title required").max(200),
  content: z.string().min(1, "Content required").max(3000),
  priority: z.enum(["normal", "urgent"]).default("normal"),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
