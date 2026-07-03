"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";

const upcomingEvents = [
  { title: "Recruitment Drive: New Mages", date: "July 15-17, 2026", location: "Student Center", status: "registered" },
  { title: "Manga Art Workshop", date: "August 10, 2026", location: "Fine Arts Building", status: "open" },
  { title: "Guild Wars: Esports", date: "September 5-7, 2026", location: "Computer Lab", status: "open" },
  { title: "Arcane Convergence 2026", date: "October 18, 2026", location: "Auditorium", status: "open" },
];

export default function MemberEventsPage() {
  return (
    <div>
      <h1 className="mb-2 font-display text-[36px] text-white">Upcoming Events</h1>
      <p className="mb-8 font-body text-[16px] text-offwhite">Events you can attend or register for.</p>

      <div className="flex flex-col gap-4">
        {upcomingEvents.map((event, i) => (
          <motion.div
            key={i}
            className="flex flex-col gap-3 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5 sm:flex-row sm:items-center sm:justify-between"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div>
              <h3 className="font-body text-[16px] font-medium text-white">{event.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1 font-body text-[13px] text-offwhite/70">
                  <Calendar className="h-3.5 w-3.5 text-primary/60" /> {event.date}
                </span>
                <span className="flex items-center gap-1 font-body text-[13px] text-offwhite/70">
                  <MapPin className="h-3.5 w-3.5 text-primary/60" /> {event.location}
                </span>
              </div>
            </div>
            {event.status === "registered" ? (
              <span className="rounded-full bg-green-500/10 px-4 py-1.5 font-body text-[12px] font-bold uppercase text-green-400">
                Registered ✓
              </span>
            ) : (
              <button className="rounded-full bg-primary/10 px-4 py-1.5 font-body text-[12px] font-bold uppercase text-primary transition-colors hover:bg-primary/20">
                Register
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
