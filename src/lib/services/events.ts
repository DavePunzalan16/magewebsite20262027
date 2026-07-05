import { createAdminClient } from "@/lib/supabase/server";

/**
 * Events Service — RSVP, Attendance, Waitlist, Analytics
 * Uses existing tables: events, event_registrations, attendance
 */
export class EventsService {
  private db = createAdminClient();

  // === Events CRUD ===

  async getAll(options?: { status?: string; limit?: number }) {
    let query = this.db.from("events").select("*").order("created_at", { ascending: false });
    if (options?.status) query = query.eq("status", options.status);
    if (options?.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: number) {
    const { data, error } = await this.db.from("events").select("*").eq("id", id).single();
    if (error) return null;
    return data;
  }

  // === RSVP ===

  async rsvp(eventId: number, userId: string): Promise<{ success: boolean; waitlisted: boolean; error?: string }> {
    // Check if event exists and has capacity
    const event = await this.getById(eventId);
    if (!event) return { success: false, waitlisted: false, error: "Event not found" };

    // Check if already registered
    const { data: existing } = await this.db
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (existing) return { success: false, waitlisted: false, error: "Already registered" };

    // Check capacity
    if (event.max_slots) {
      const { count } = await this.db
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

      if ((count || 0) >= event.max_slots) {
        // Waitlist (for now, just reject — can extend later)
        return { success: false, waitlisted: true, error: "Event is full" };
      }
    }

    // Register
    const { error } = await this.db
      .from("event_registrations")
      .insert({ event_id: eventId, user_id: userId });

    if (error) return { success: false, waitlisted: false, error: error.message };

    // Log activity
    await this.db.from("activity_logs").insert({
      user_id: userId,
      action: "rsvp",
      entity_type: "event",
      entity_id: String(eventId),
    });

    return { success: true, waitlisted: false };
  }

  async cancelRsvp(eventId: number, userId: string) {
    const { error } = await this.db
      .from("event_registrations")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }

  async getRegistrations(eventId: number) {
    const { data, error } = await this.db
      .from("event_registrations")
      .select("*, profiles(full_name, avatar_url, college)")
      .eq("event_id", eventId)
      .order("registered_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getRegistrationCount(eventId: number): Promise<number> {
    const { count } = await this.db
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);
    return count || 0;
  }

  async isUserRegistered(eventId: number, userId: string): Promise<boolean> {
    const { data } = await this.db
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();
    return !!data;
  }

  // === QR Attendance ===

  async checkIn(eventId: number, userId: string, status: "present" | "late" = "present") {
    // Verify user is registered
    const registered = await this.isUserRegistered(eventId, userId);
    if (!registered) return { success: false, error: "User not registered for this event" };

    // Check if already checked in
    const { data: existing } = await this.db
      .from("attendance")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (existing) return { success: false, error: "Already checked in" };

    const { error } = await this.db
      .from("attendance")
      .insert({ event_id: eventId, user_id: userId, status });

    if (error) return { success: false, error: error.message };

    await this.db.from("activity_logs").insert({
      user_id: userId,
      action: "check_in",
      entity_type: "event",
      entity_id: String(eventId),
      metadata: { status },
    });

    return { success: true };
  }

  async getAttendance(eventId: number) {
    const { data, error } = await this.db
      .from("attendance")
      .select("*, profiles(full_name, avatar_url)")
      .eq("event_id", eventId)
      .order("checked_in_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // === Analytics ===

  async getEventStats(eventId: number) {
    const [registrations, attendance] = await Promise.all([
      this.getRegistrationCount(eventId),
      this.db.from("attendance").select("*", { count: "exact", head: true }).eq("event_id", eventId),
    ]);

    return {
      registrations,
      attendance: attendance.count || 0,
      attendanceRate: registrations > 0 ? Math.round(((attendance.count || 0) / registrations) * 100) : 0,
    };
  }
}
