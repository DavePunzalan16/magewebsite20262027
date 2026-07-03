"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventItem {
  id: string;
  title: string;
  date: string;
  status: "upcoming" | "ongoing" | "completed";
}

const mockEvents: EventItem[] = [
  { id: "1", title: "Arcane Convergence 2026", date: "October 18, 2026", status: "upcoming" },
  { id: "2", title: "Manga Art Workshop", date: "August 10, 2026", status: "upcoming" },
  { id: "3", title: "Guild Wars: Esports", date: "September 5-7, 2026", status: "upcoming" },
  { id: "4", title: "Anime Screening Night", date: "Every Last Friday", status: "ongoing" },
  { id: "5", title: "Recruitment Drive", date: "July 15-17, 2026", status: "upcoming" },
];

export default function AdminEventsPage() {
  const [events, setEvents] = useState(mockEvents);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  const addEvent = () => {
    if (!newTitle || !newDate) return;
    setEvents((prev) => [...prev, { id: Date.now().toString(), title: newTitle, date: newDate, status: "upcoming" }]);
    setNewTitle("");
    setNewDate("");
    setShowForm(false);
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[36px] text-white">Manage Events</h1>
          <p className="font-body text-[16px] text-offwhite">Create, edit, and manage guild events.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Add Event
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <motion.div
          className="mb-6 rounded-[12px] border border-dark-gray/40 bg-surface/30 p-5"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <h3 className="mb-4 font-body text-[16px] font-semibold text-white">New Event</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Event title"
              className="flex-1 rounded-[6px] bg-background/80 px-4 py-2.5 font-body text-[14px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              placeholder="Date (e.g. October 18, 2026)"
              className="flex-1 rounded-[6px] bg-background/80 px-4 py-2.5 font-body text-[14px] text-white placeholder:text-offwhite/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={addEvent}>Save</Button>
          </div>
        </motion.div>
      )}

      {/* Events list */}
      <div className="flex flex-col gap-3">
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            className="flex items-center justify-between rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary/60" />
              <div>
                <p className="font-body text-[15px] font-medium text-white">{event.title}</p>
                <p className="font-body text-[12px] text-offwhite/60">{event.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-bold uppercase ${
                event.status === "upcoming" ? "bg-green-500/10 text-green-400" :
                event.status === "ongoing" ? "bg-yellow-500/10 text-yellow-400" :
                "bg-gray-500/10 text-gray-400"
              }`}>{event.status}</span>
              <button className="rounded p-1.5 text-offwhite/50 hover:bg-surface hover:text-white"><Edit className="h-4 w-4" /></button>
              <button onClick={() => deleteEvent(event.id)} className="rounded p-1.5 text-offwhite/50 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
