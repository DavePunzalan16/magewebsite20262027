import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(300).optional(),
  avatar_url: z.string().url().nullable().optional(),
  favorite_anime: z.string().max(200).nullable().optional(),
  favorite_game: z.string().max(200).nullable().optional(),
  favorite_manga: z.string().max(200).nullable().optional(),
  favorite_character: z.string().max(200).nullable().optional(),
  anime_genres: z.array(z.string()).nullable().optional(),
  game_genres: z.array(z.string()).nullable().optional(),
  manga_genres: z.array(z.string()).nullable().optional(),
});

export const membershipApplicationSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  student_id: z.string().min(1, "Student ID required"),
  college: z.string().min(1, "College required"),
  course: z.string().min(1, "Course required"),
  year_level: z.string().min(1, "Year level required"),
  interests: z.array(z.string()).optional(),
  preferred_department: z.string().optional(),
  why_join: z.string().max(1000).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type MembershipApplicationInput = z.infer<typeof membershipApplicationSchema>;
