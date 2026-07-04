"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(3000),
  priority: z.enum(["normal", "urgent"]).default("normal"),
});

export async function createAnnouncement(input: z.infer<typeof announcementSchema> & { created_by: string }) {
  const validated = announcementSchema.parse(input);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("announcements")
    .insert({ ...validated, created_by: input.created_by })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/announcements");
  revalidatePath("/");
  return { announcement: data };
}

export async function deleteAnnouncement(id: number) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/announcements");
  revalidatePath("/");
  return { success: true };
}

export async function getAnnouncements() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, announcements: [] };
  return { announcements: data || [] };
}
