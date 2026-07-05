import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1, "Title required").max(200),
  description: z.string().max(2000).optional(),
  long_description: z.string().max(5000).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  status: z.enum(["upcoming", "ongoing", "completed"]).default("upcoming"),
  max_slots: z.number().nullable().optional(),
});

export const rsvpSchema = z.object({
  event_id: z.number(),
});

export const attendanceSchema = z.object({
  event_id: z.number(),
  user_id: z.string().uuid(),
  status: z.enum(["present", "absent", "late"]).default("present"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
