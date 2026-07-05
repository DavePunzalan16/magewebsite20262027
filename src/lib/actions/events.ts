"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { createEventSchema, type CreateEventInput } from "@/lib/validators/events";
import { EventsService } from "@/lib/services/events";
import { revalidatePath } from "next/cache";

export async function createEvent(input: CreateEventInput & { created_by: string }) {
  const validated = createEventSchema.parse(input);
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

export async function updateEvent(id: number, input: Partial<CreateEventInput>) {
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
  const service = new EventsService();
  return service.getAll();
}

export async function rsvpToEvent(eventId: number, userId: string) {
  const service = new EventsService();
  return service.rsvp(eventId, userId);
}

export async function cancelRsvp(eventId: number, userId: string) {
  const service = new EventsService();
  await service.cancelRsvp(eventId, userId);
  return { success: true };
}

export async function checkInAttendee(eventId: number, userId: string, status: "present" | "late" = "present") {
  const service = new EventsService();
  return service.checkIn(eventId, userId, status);
}

export async function getEventStats(eventId: number) {
  const service = new EventsService();
  return service.getEventStats(eventId);
}
