"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { uploadFile } from "@/lib/upload";
import { Plus, Trash2, Calendar, ImageIcon } from "lucide-react";

interface EventItem { id: number; title: string; description: string | null; date: string | null; time: string | null; location: string | null; status: string; images: string[] | null; created_at: string; }

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [postToFeed, setPostToFeed] = useState(false);
  const [eventImages, setEventImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("events").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setEvents(data); setLoading(false); });
  }, []);

  const addEvent = async () => {
    if (!title || !user) return;
    const supabase = createClient();

    // Upload images (max 5)
    let imageUrls: string[] = [];
    for (const file of eventImages.slice(0, 5)) {
      const url = await uploadFile(file, "events");
      if (url) imageUrls.push(url);
    }

    const { data, error } = await supabase.from("events").insert({
      title, description: description || null, date: date || null, time: time || null,
      location: location || null, status: "upcoming", created_by: user.id,
      images: imageUrls.length > 0 ? imageUrls : null,
    }).select().single();

    if (!error && data) {
      setEvents((prev) => [data, ...prev]);
      if (postToFeed) {
        await supabase.from("posts").insert({
          user_id: user.id,
          content: `📅 New Event: ${title}\n${description ? description + "\n" : ""}${date ? `Date: ${date}` : ""} ${time ? `| ${time}` : ""}\n${location ? `📍 ${location}` : ""}`,
          category: "announcement", is_pinned: true,
        });
      }
      setTitle(""); setDescription(""); setDate(""); setTime(""); setLocation(""); setPostToFeed(false); setEventImages([]); setShowForm(false);
    }
  };

  const deleteEvent = async (id: number) => {
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[30px] text-white md:text-[38px]">Events</h1>
          <p className="font-body text-[13px] text-offwhite/50">Manage guild events ({events.length} total) — published events show on homepage</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-[8px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

      {showForm && (
        <motion.div className="mb-6 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid gap-3 md:grid-cols-2">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title *"
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none md:col-span-2" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2}
              className="resize-none rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none md:col-span-2" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white focus:border-primary/40 focus:outline-none" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white focus:border-primary/40 focus:outline-none" />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none" />
            <label className="flex items-center gap-2 font-body text-[12px] text-offwhite/60">
              <input type="checkbox" checked={postToFeed} onChange={(e) => setPostToFeed(e.target.checked)} className="rounded" />
              Also post to Feed
            </label>
          </div>
          {/* Image upload */}
          <div className="mt-3">
            <button onClick={() => imageRef.current?.click()} type="button" className="flex items-center gap-1.5 rounded-[6px] bg-surface px-3 py-1.5 font-body text-[11px] text-offwhite hover:text-white">
              📷 Add Images (max 5)
            </button>
            <input ref={imageRef} type="file" accept="image/*" multiple onChange={(e) => { const files = Array.from(e.target.files || []); setEventImages(files.slice(0, 5)); }} className="hidden" />
            {eventImages.length > 0 && <p className="mt-1 font-body text-[10px] text-primary">{eventImages.length} image(s) selected</p>}
          </div>
          <button onClick={addEvent} disabled={!title} className="mt-3 rounded-[6px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90 disabled:opacity-50">Publish Event</button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-[10px] bg-surface/30" />)}</div>
      ) : events.length === 0 ? (
        <p className="font-body text-[13px] text-offwhite/40">No events yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onDelete={deleteEvent} />
          ))}
        </div>
      )}
    </div>
  );
}


// Event card with description, registered members (realtime)
function EventCard({ event, onDelete }: { event: EventItem; onDelete: (id: number) => void }) {
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<{ id: string; full_name: string | null; avatar_url: string | null; registered_at: string }[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch member count on mount + realtime
  useEffect(() => {
    const supabase = createClient();
    // Initial count
    supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", event.id)
      .then(({ count }) => { if (count !== null) setMemberCount(count); });

    // Realtime subscription for registration changes
    const channel = supabase.channel(`event-reg-${event.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_registrations", filter: `event_id=eq.${event.id}` },
        () => {
          // Refresh count
          supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", event.id)
            .then(({ count }) => { if (count !== null) setMemberCount(count); });
          // Refresh members list if expanded
          if (showMembers) fetchMembers();
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [event.id]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("event_registrations")
      .select("id, user_id, created_at, profiles(full_name, avatar_url)")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });

    if (data) {
      setMembers(data.map((d: any) => ({
        id: d.user_id,
        full_name: d.profiles?.full_name || "Unknown",
        avatar_url: d.profiles?.avatar_url || null,
        registered_at: d.created_at,
      })));
    }
    setLoadingMembers(false);
  };

  const toggleMembers = () => {
    if (!showMembers) fetchMembers();
    setShowMembers(!showMembers);
  };

  return (
    <div className="rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Calendar className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-body text-[14px] font-medium text-white">{event.title}</p>
            {event.description && (
              <p className="mt-1 font-body text-[12px] text-offwhite/60 line-clamp-2">{event.description}</p>
            )}
            <p className="mt-1 font-body text-[11px] text-offwhite/40">
              {event.date || "No date"} {event.time ? `· ${event.time}` : ""} {event.location ? `· ${event.location}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Registered members button */}
          <button onClick={toggleMembers} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-body text-[10px] text-primary hover:bg-primary/20 transition-colors" title="View registered members">
            👥 <span className="font-bold">{memberCount}</span>
          </button>
          <button onClick={() => onDelete(event.id)} className="rounded p-1.5 text-offwhite/30 hover:text-red-400">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Registered members panel */}
      {showMembers && (
        <motion.div className="mt-3 border-t border-dark-gray/20 pt-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <p className="mb-2 font-body text-[11px] font-semibold text-white">Registered Members ({memberCount})</p>
          {loadingMembers ? (
            <p className="font-body text-[11px] text-offwhite/40">Loading...</p>
          ) : members.length === 0 ? (
            <p className="font-body text-[11px] text-offwhite/40">No registrations yet.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-[6px] bg-background/30 px-3 py-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {m.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[11px] text-white truncate">{m.full_name}</p>
                  </div>
                  <span className="font-body text-[9px] text-offwhite/30 shrink-0">
                    {new Date(m.registered_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
