"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1).max(200),
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

export async function createEvent(input: z.infer<typeof eventSchema> & { created_by: string }) {
  const validated = eventSchema.parse(input);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("events")
    .insert({ ...validated, created_by: input.created_by })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/events");
  revalidatePath("/");
  return { event: data };
}

export async function updateEvent(id: number, input: Partial<z.infer<typeof eventSchema>>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/events");
  revalidatePath("/");
  return { event: data };
}

export async function deleteEvent(id: number) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/events");
  revalidatePath("/");
  return { success: true };
}

export async function getEvents() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, events: [] };
  return { events: data || [] };
}
