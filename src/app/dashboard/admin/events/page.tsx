"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Plus, Trash2, Calendar } from "lucide-react";

interface EventItem { id: number; title: string; description: string | null; date: string | null; time: string | null; location: string | null; status: string; created_at: string; }

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("events").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setEvents(data); setLoading(false); });
  }, []);

  const addEvent = async () => {
    if (!title || !user) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("events").insert({
      title, description: description || null, date: date || null, time: time || null,
      location: location || null, status: "upcoming", created_by: user.id,
    }).select().single();

    if (!error && data) {
      setEvents((prev) => [data, ...prev]);
      // Also post to feed if checked
      if (postToFeed) {
        await supabase.from("posts").insert({
          user_id: user.id,
          content: `📅 New Event: ${title}\n${description ? description + "\n" : ""}${date ? `Date: ${date}` : ""} ${time ? `| ${time}` : ""}\n${location ? `📍 ${location}` : ""}`,
          category: "announcement",
          is_pinned: true,
        });
      }
      setTitle(""); setDescription(""); setDate(""); setTime(""); setLocation(""); setPostToFeed(false); setShowForm(false);
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
            <div key={event.id} className="flex items-center justify-between rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary/60" />
                <div>
                  <p className="font-body text-[14px] font-medium text-white">{event.title}</p>
                  <p className="font-body text-[11px] text-offwhite/40">{event.date || "No date"} {event.time ? `· ${event.time}` : ""} {event.location ? `· ${event.location}` : ""}</p>
                </div>
              </div>
              <button onClick={() => deleteEvent(event.id)} className="rounded p-1.5 text-offwhite/30 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
