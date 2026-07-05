"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Calendar, MapPin, Clock, Users, Check, X } from "lucide-react";

interface EventItem {
  id: number;
  title: string;
  description: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  status: string;
  max_slots: number | null;
  registered?: boolean;
  registration_count?: number;
}

export default function MemberEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      const supabase = createClient();

      // Get all upcoming events
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title, description, date, time, location, status, max_slots")
        .order("created_at", { ascending: false });

      if (!eventsData) { setLoading(false); return; }

      // Check which ones the user is registered for
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", user.id);

      const registeredIds = new Set(registrations?.map((r) => r.event_id) || []);

      // Get registration counts
      const enriched = await Promise.all(eventsData.map(async (event) => {
        const { count } = await supabase
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);

        return { ...event, registered: registeredIds.has(event.id), registration_count: count || 0 };
      }));

      setEvents(enriched);
      setLoading(false);
    };

    fetchEvents();
  }, [user]);

  const handleRsvp = async (eventId: number) => {
    if (!user) return;
    setActionLoading(eventId);

    const supabase = createClient();
    const event = events.find((e) => e.id === eventId);

    if (event?.registered) {
      // Cancel RSVP
      await supabase.from("event_registrations").delete().eq("event_id", eventId).eq("user_id", user.id);
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, registered: false, registration_count: (e.registration_count || 1) - 1 } : e));
    } else {
      // Register
      const { error } = await supabase.from("event_registrations").insert({ event_id: eventId, user_id: user.id });
      if (!error) {
        setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, registered: true, registration_count: (e.registration_count || 0) + 1 } : e));
      }
    }

    setActionLoading(null);
  };

  return (
    <div>
      <h1 className="mb-2 font-display text-[30px] text-white md:text-[38px]">Events</h1>
      <p className="mb-8 font-body text-[13px] text-offwhite/50">Register for upcoming guild events.</p>

      {loading ? (
        <div className="flex flex-col gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-[12px] bg-surface/30" />)}</div>
      ) : events.length === 0 ? (
        <p className="font-body text-[14px] text-offwhite/40">No events available yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-body text-[16px] font-medium text-white">{event.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 font-body text-[9px] font-bold uppercase ${
                      event.status === "upcoming" ? "bg-green-500/10 text-green-400" :
                      event.status === "ongoing" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-gray-500/10 text-gray-400"
                    }`}>{event.status}</span>
                  </div>
                  {event.description && <p className="mb-2 font-body text-[12px] text-offwhite/60">{event.description}</p>}
                  <div className="flex flex-wrap items-center gap-4">
                    {event.date && <span className="flex items-center gap-1 font-body text-[11px] text-offwhite/40"><Calendar className="h-3 w-3 text-primary/50" />{event.date}</span>}
                    {event.time && <span className="flex items-center gap-1 font-body text-[11px] text-offwhite/40"><Clock className="h-3 w-3 text-primary/50" />{event.time}</span>}
                    {event.location && <span className="flex items-center gap-1 font-body text-[11px] text-offwhite/40"><MapPin className="h-3 w-3 text-primary/50" />{event.location}</span>}
                    <span className="flex items-center gap-1 font-body text-[11px] text-offwhite/40">
                      <Users className="h-3 w-3 text-primary/50" />
                      {event.registration_count}{event.max_slots ? `/${event.max_slots}` : ""} registered
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRsvp(event.id)}
                  disabled={actionLoading === event.id}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-body text-[12px] font-medium transition-all ${
                    event.registered
                      ? "bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {actionLoading === event.id ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : event.registered ? (
                    <><Check className="h-3.5 w-3.5" /> Registered</>
                  ) : (
                    "Register"
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
