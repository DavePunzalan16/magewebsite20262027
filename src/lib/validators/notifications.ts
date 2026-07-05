import { z } from "zod";

export const notificationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
