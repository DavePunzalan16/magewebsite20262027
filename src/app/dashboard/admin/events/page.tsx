"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Plus, Trash2, Calendar } from "lucide-react";

interface EventItem { id: number; title: string; date: string | null; status: string; created_at: string; }

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("events").select("id, title, date, status, created_at").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setEvents(data); setLoading(false); });
  }, []);

  const addEvent = async () => {
    if (!title || !user) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("events").insert({ title, date: date || null, status: "upcoming", created_by: user.id }).select().single();
    if (!error && data) { setEvents((prev) => [data, ...prev]); setTitle(""); setDate(""); setShowForm(false); }
  };

  const deleteEvent = async (id: number) => {
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[32px] text-white md:text-[40px]">Events</h1>
          <p className="font-body text-[14px] text-offwhite/60">Manage guild events ({events.length} total)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-[8px] bg-primary px-4 py-2 font-body text-[13px] font-bold text-black hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

      {showForm && (
        <motion.div className="mb-6 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title"
              className="flex-1 rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none" />
            <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Date (e.g. Oct 18, 2026)"
              className="flex-1 rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none" />
            <button onClick={addEvent} className="rounded-[6px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90">Save</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-[10px] bg-surface/30" />)}</div>
      ) : events.length === 0 ? (
        <p className="font-body text-[13px] text-offwhite/40">No events yet. Create one above.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event, i) => (
            <motion.div key={event.id} className="flex items-center justify-between rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary/60" />
                <div>
                  <p className="font-body text-[14px] font-medium text-white">{event.title}</p>
                  <p className="font-body text-[11px] text-offwhite/40">{event.date || "No date set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 font-body text-[10px] font-bold uppercase ${event.status === "upcoming" ? "bg-green-500/10 text-green-400" : event.status === "ongoing" ? "bg-yellow-500/10 text-yellow-400" : "bg-gray-500/10 text-gray-400"}`}>{event.status}</span>
                <button onClick={() => deleteEvent(event.id)} className="rounded p-1.5 text-offwhite/30 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
