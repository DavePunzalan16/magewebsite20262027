import { z } from "zod";

export const createReportSchema = z.object({
  post_id: z.number().int().positive(),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
});

export const moderatePostSchema = z.object({
  action: z.enum(["hide", "unhide", "soft_delete"]),
  reason: z.string().max(500).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ModeratePostInput = z.infer<typeof moderatePostSchema>;
